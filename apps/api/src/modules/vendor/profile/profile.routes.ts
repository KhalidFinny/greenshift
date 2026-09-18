import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorProfileBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { getVendorProfile, saveVendorProfile } from "./profile.service";

const factory = createFactory<ApiEnv>();

export const profileRoutes = new Hono<ApiEnv>();

const MAX_COMPANY_NAME = 200;
const MAX_PROFILE_DESCRIPTION = 2000;
const MAX_LIST_ITEMS = 50;
// Worst-case ASCII payload (50×100×2 arrays + description ≈ 12.6KB) stays
// under the 16KB body cap. Multibyte- or escape-heavy maximal input can still
// exceed it (char vs byte units): same pre-existing class as PATCH proposals.
const MAX_ITEM_LENGTH = 100;

// ── profile ───────────────────────────────────────────────
profileRoutes.get(
	"/profile",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const profile = await getVendorProfile(db, c.get("user").id);
		if (!profile) {
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
		return c.json({ profile });
	}),
);

profileRoutes.put(
	"/profile",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "profile")(c);
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

		const result = await saveVendorProfile(db, userId, values);
		if (result.status === "upsert_failed") {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to save profile" } },
				500,
			);
		}
		if (result.status === "load_failed") {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to load profile" } },
				500,
			);
		}
		return c.json({ profile: result.profile });
	}),
);
