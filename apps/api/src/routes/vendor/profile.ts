import { eq } from "drizzle-orm";
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
// exceed it (char vs byte units): same pre-existing class as PATCH proposals.
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
						message: "Vendor profile has not been created",
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
				{ error: { code: "VALIDATION", message: "Invalid input" } },
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

		// Atomic upsert: conflicts on the unique user_id index, so two first-time
		// saves racing cannot create duplicate profiles (single statement).
		const [saved] = await db
			.insert(vendors)
			.values({
				userId,
				companyName: values.companyName,
				description: values.description,
				certifications: values.certifications,
				portfolio: values.portfolio,
			})
			.onConflictDoUpdate({
				target: vendors.userId,
				set: {
					companyName: values.companyName,
					description: values.description,
					certifications: values.certifications,
					portfolio: values.portfolio,
				},
			})
			.returning({ id: vendors.id });

		if (!saved) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to save profile" } },
				500,
			);
		}
		const created = !existing;
		const vendorId = saved.id;

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
				{ error: { code: "INTERNAL", message: "Failed to load profile" } },
				500,
			);
		}
		return c.json({ profile: toVendorProfile(row.vendor, row.user) });
	}),
);
