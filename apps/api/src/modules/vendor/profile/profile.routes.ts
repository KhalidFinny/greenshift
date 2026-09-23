import { Hono } from "hono";
import { createFactory } from "hono/factory";
import {
	type VendorProfileBody,
	vendorServiceCategories,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import {
	MAX_DOCUMENT_BYTES,
	MULTIPART_ENVELOPE_SLACK,
} from "../../../lib/document-upload";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import {
	attachVendorCertificate,
	readVendorCertificate,
} from "./certificate.service";
import type { VendorProfileValues } from "./profile.repository";
import { getVendorProfile, saveVendorProfile } from "./profile.service";

const factory = createFactory<ApiEnv>();

export const profileRoutes = new Hono<ApiEnv>();

const MAX_COMPANY_NAME = 200;
const MAX_PROFILE_DESCRIPTION = 2000;
const MAX_LOCATION = 300;
/** NIB, NPWP and TDP as they are written on the document; format is not enforced. */
const LEGAL_ID_RE = /^[\d.\-\s]+$/;
const MAX_LIST_ITEMS = 50;
// Worst-case ASCII payload (50x100x2 arrays + description, ~12.6KB) stays under
// the 16KB body cap; multibyte- or escape-heavy input can still exceed it.
const MAX_ITEM_LENGTH = 100;

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
		const tdp = body?.tdp;
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
			!isLegalId(tdp) ||
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
			...(tdp !== undefined ? { tdp } : {}),
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

profileRoutes.post(
	"/profile/certificate",
	mutationRateLimit("vendor", "profile"),
	...factory.createHandlers(async (c) => {
		// The declared length is read before the body is: `parseBody` buffers the whole
		// request, so an oversized file has to be turned away first.
		const declared = Number(c.req.header("content-length") ?? "0");
		if (
			Number.isFinite(declared) &&
			declared > MAX_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK
		) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The certificate must be 10 MB or smaller.",
			);
		}

		const parsed = await c.req.parseBody().catch(() => null);
		const file = parsed?.file;
		if (!(file instanceof File)) {
			return apiError(c, "VALIDATION", "Attach the file in the 'file' field.");
		}

		const result = await attachVendorCertificate(
			createDb(c.env.DB),
			c.env,
			c.get("user").id,
			file,
		);
		if (result.status === "not_found") {
			return apiError(c, "NOT_FOUND", "Vendor profile has not been created");
		}
		if (result.status === "too_large") {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The certificate must be 10 MB or smaller.",
			);
		}
		if (result.status === "unsupported") {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The certificate must be a PDF, PNG, JPG or WebP.",
			);
		}
		return apiSuccess(c, { profile: result.profile }, "Certificate filed");
	}),
);

profileRoutes.get(
	"/profile/certificate",
	...factory.createHandlers(async (c) => {
		const result = await readVendorCertificate(
			createDb(c.env.DB),
			c.env,
			c.get("user").id,
		);
		if (result.outcome === "not_found") return apiError(c, "NOT_FOUND");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
