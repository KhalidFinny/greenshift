import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorProfile, VendorProfileBody } from "../../contracts";
import { createDb } from "../../db";
import { auditLogs, users, vendors } from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import { iso, mutationRateLimit } from "./helpers";

const factory = createFactory<ApiEnv>();

export const profileRoutes = new Hono<ApiEnv>();

const MAX_COMPANY_NAME = 200;
const MAX_PROFILE_DESCRIPTION = 2000;
const MAX_LIST_ITEMS = 50;
// Worst-case ASCII payload (50×100×2 arrays + description ≈ 12.6KB) stays
// under the 16KB body cap. Multibyte- or escape-heavy maximal input can still
// exceed it (char vs byte units) — same pre-existing class as PATCH proposals.
const MAX_ITEM_LENGTH = 100;

function toVendorProfile(
	vendor: typeof vendors.$inferSelect,
	user: typeof users.$inferSelect,
): VendorProfile {
	return {
		id: vendor.id,
		userId: vendor.userId,
		companyName: vendor.companyName,
		description: vendor.description,
		certifications: (vendor.certifications as string[]) ?? [],
		portfolio: (vendor.portfolio as string[]) ?? [],
		rating: vendor.rating ?? 0,
		totalProjects: vendor.totalProjects ?? 0,
		verified: vendor.verifiedAt !== null,
		verifiedAt: iso(vendor.verifiedAt),
		userEmail: user.email,
		userName: user.name,
		createdAt: iso(vendor.createdAt),
	};
}

// ── profile ───────────────────────────────────────────────
profileRoutes.get(
	"/profile",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const [row] = await db
			.select({ vendor: vendors, user: users })
			.from(vendors)
			.innerJoin(users, eq(vendors.userId, users.id))
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);

		if (!row) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Profil vendor belum dibuat",
					},
				},
				404,
			);
		}
		return c.json({ profile: toVendorProfile(row.vendor, row.user) });
	}),
);

// Upsert: creates the profile on first save, updates afterwards, and keeps
// users.companyName in sync. No DELETE: vendor_profiles cascades to proposals.
profileRoutes.put(
	"/profile",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "profile");
		if (rateError) return rateError;

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VendorProfileBody> | null;
		const companyName = body?.companyName;
		const description = body?.description;
		const certifications = body?.certifications;
		const portfolio = body?.portfolio;

		const isStringArray = (v: unknown): v is string[] =>
			Array.isArray(v) &&
			v.length <= MAX_LIST_ITEMS &&
			v.every(
				(item) => typeof item === "string" && item.length <= MAX_ITEM_LENGTH,
			);

		if (
			typeof companyName !== "string" ||
			companyName.trim().length === 0 ||
			companyName.length > MAX_COMPANY_NAME ||
			(description !== undefined &&
				(typeof description !== "string" ||
					description.length > MAX_PROFILE_DESCRIPTION)) ||
			(certifications !== undefined && !isStringArray(certifications)) ||
			(portfolio !== undefined && !isStringArray(portfolio))
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const values = {
			companyName: companyName.trim(),
			description: description ?? null,
			certifications: certifications ?? [],
			portfolio: portfolio ?? [],
		};

		const [existing] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);

		let vendorId: number;
		let created = false;
		if (existing) {
			vendorId = existing.id;
			await db.update(vendors).set(values).where(eq(vendors.id, existing.id));
		} else {
			created = true;
			// Atomic create: the NOT EXISTS gate prevents duplicate profiles
			// when two first-time saves race (no unique index on user_id).
			const now = Date.now();
			const runResult = await db.run(sql`
				INSERT INTO vendor_profiles (user_id, company_name, description, certifications, portfolio, created_at)
				SELECT ${userId}, ${values.companyName}, ${values.description}, ${JSON.stringify(values.certifications)}, ${JSON.stringify(values.portfolio)}, ${now}
				WHERE NOT EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.user_id = ${userId})
				RETURNING id
			`);
			const firstRow = runResult.results?.[0] as
				| Record<string, unknown>
				| undefined;
			const createdId = Number(firstRow?.id);
			if (!Number.isInteger(createdId) || createdId <= 0) {
				// Lost the race: another request created it — update instead.
				const [other] = await db
					.select({ id: vendors.id })
					.from(vendors)
					.where(eq(vendors.userId, userId))
					.limit(1);
				if (!other) {
					return c.json(
						{ error: { code: "INTERNAL", message: "Gagal menyimpan profil" } },
						500,
					);
				}
				created = false;
				vendorId = other.id;
				await db.update(vendors).set(values).where(eq(vendors.id, other.id));
			} else {
				vendorId = createdId;
			}
		}

		await db.batch([
			db
				.update(users)
				.set({ companyName: values.companyName })
				.where(eq(users.id, userId)),
			db.insert(auditLogs).values({
				userId,
				action: created ? "vendor.profile_created" : "vendor.profile_updated",
				entityType: "vendor_profile",
				entityId: vendorId,
				metadata: { companyName: values.companyName },
			}),
		]);

		const [row] = await db
			.select({ vendor: vendors, user: users })
			.from(vendors)
			.innerJoin(users, eq(vendors.userId, users.id))
			.where(eq(vendors.id, vendorId))
			.limit(1);
		if (!row) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Gagal memuat profil" } },
				500,
			);
		}
		return c.json({ profile: toVendorProfile(row.vendor, row.user) });
	}),
);
