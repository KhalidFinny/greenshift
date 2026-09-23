import { Hono } from "hono";
import { createFactory } from "hono/factory";
import {
	type VendorProfileBody,
	vendorServiceCategories,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import type { VendorProfileValues } from "./profile.repository";
import { getVendorProfile, saveVendorProfile } from "./profile.service";

const factory = createFactory<ApiEnv>();

export const profileRoutes = new Hono<ApiEnv>();

const MAX_COMPANY_NAME = 200;
const MAX_PROFILE_DESCRIPTION = 2000;
const MAX_LOCATION = 300;
/** NIB and NPWP as they are written on the document; format is not enforced. */
const LEGAL_ID_RE = /^[\d.\-\s]+$/;
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
			return apiError(c, "NOT_FOUND", "Vendor profile has not been created");
		}
		return c.json({ profile });
	}),
);

profileRoutes.put(
	"/profile",
	mutationRateLimit("vendor", "profile"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VendorProfileBody> | null;
		const companyName = body?.companyName;
		const description = body?.description;
		const serviceCategory = body?.serviceCategory;
		const location = body?.location;
		const nib = body?.nib;
		const npwp = body?.npwp;
		const certifications = body?.certifications;
		const portfolio = body?.portfolio;

		const isStringArray = (v: unknown): v is string[] =>
			Array.isArray(v) &&
			v.length <= MAX_LIST_ITEMS &&
			v.every(
				(item) => typeof item === "string" && item.length <= MAX_ITEM_LENGTH,
			);
		/** A field the save may leave out, clear with null, or set. */
		const isOptionalText = (v: unknown, max: number) =>
			v === null ||
			v === undefined ||
			(typeof v === "string" && v.length <= max);
		const isLegalId = (v: unknown) =>
			v === null ||
			v === undefined ||
			(typeof v === "string" && LEGAL_ID_RE.test(v));

		if (
			typeof companyName !== "string" ||
			companyName.trim().length === 0 ||
			companyName.length > MAX_COMPANY_NAME ||
			!isOptionalText(description, MAX_PROFILE_DESCRIPTION) ||
			!isOptionalText(location, MAX_LOCATION) ||
			!isLegalId(nib) ||
			!isLegalId(npwp) ||
			(serviceCategory !== null &&
				serviceCategory !== undefined &&
				(typeof serviceCategory !== "string" ||
					!(vendorServiceCategories as readonly string[]).includes(
						serviceCategory,
					))) ||
			(certifications !== undefined && !isStringArray(certifications)) ||
			(portfolio !== undefined && !isStringArray(portfolio))
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const values: VendorProfileValues = {
			companyName: companyName.trim(),
			...(description !== undefined ? { description } : {}),
			...(serviceCategory !== undefined ? { serviceCategory } : {}),
			...(location !== undefined ? { location } : {}),
			...(nib !== undefined ? { nib } : {}),
			...(npwp !== undefined ? { npwp } : {}),
			...(certifications !== undefined ? { certifications } : {}),
			...(portfolio !== undefined ? { portfolio } : {}),
		};

		const result = await saveVendorProfile(db, userId, values);
		if (result.status === "upsert_failed") {
			return apiError(c, "INTERNAL", "Failed to save profile");
		}
		if (result.status === "load_failed") {
			return apiError(c, "INTERNAL", "Failed to load profile");
		}
		return apiSuccess(c, { profile: result.profile }, "Vendor profile saved");
	}),
);
