/* The company's verification endpoints: the only routes a business account can
 * reach before an administrator has verified it.
 *
 * Multipart, like every upload: `requireJsonBody` is not on this router, so the
 * JSON mutations guard themselves and the certificate route takes the file as it
 * is. The download route answers with the company's own file.
 */

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { CompanyVerificationBody } from "../../../contracts";
import { registerLimits } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import {
	MAX_DOCUMENT_BYTES,
	MULTIPART_ENVELOPE_SLACK,
} from "../../../lib/document-upload";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	attachCompanyDocument,
	isCompanyDocumentSlot,
	readCompanyDocument,
	readCompanyVerification,
	removeCompanyDocument,
	saveCompanyDetails,
	submitCompanyVerification,
} from "./verification.service";

const factory = createFactory<ApiEnv>();

export const verificationRoutes = new Hono<ApiEnv>();

verificationRoutes.get(
	"/verification",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const verification = await readCompanyVerification(db, c.get("user").id);
		if (!verification) return apiNotFound(c, "Company");
		return c.json({ verification });
	}),
);

// ── the details the company confirms ──────────────────────
verificationRoutes.put(
	"/verification",
	mutationRateLimit("business", "verification"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<CompanyVerificationBody> | null;
		const companyName = body?.companyName?.trim();
		const industrySector = body?.industrySector?.trim();
		const address = body?.address?.trim();
		const representative = body?.representative?.trim();
		const contactPhone = body?.contactPhone?.trim() ?? "";
		const nib = body?.nib?.trim();
		const npwp = body?.npwp?.trim();

		if (
			!companyName ||
			!industrySector ||
			!address ||
			!representative ||
			!nib ||
			!npwp ||
			companyName.length > registerLimits.organizationName ||
			industrySector.length > registerLimits.industry ||
			address.length > registerLimits.address ||
			representative.length > registerLimits.name ||
			contactPhone.length > registerLimits.phone ||
			nib.length > registerLimits.legalId ||
			npwp.length > registerLimits.legalId
		) {
			return apiError(c, "VALIDATION", "Check the company details.", {
				fields: { companyName: "Every field is required." },
			});
		}

		const db = createDb(c.env.DB);
		const result = await saveCompanyDetails(db, c.get("user").id, {
			companyName,
			industrySector,
			address,
			representative,
			contactPhone,
			nib,
			npwp,
		});

		if (result.status === "not_found") return apiNotFound(c, "Company");
		if (result.status === "verified") {
			return apiError(
				c,
				"INVALID_STATE",
				"A verified company's details are not edited here. Contact an administrator to change them.",
			);
		}
		return apiSuccess(
			c,
			{ verification: result.verification },
			"Company details saved",
		);
	}),
);

// ── file one certificate ──────────────────────────────────
verificationRoutes.post(
	"/verification/documents/:slot",
	mutationRateLimit("business", "verification"),
	...factory.createHandlers(async (c) => {
		const slot = c.req.param("slot");
		if (!isCompanyDocumentSlot(slot)) {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		// The declared length is read before the body is: `parseBody` buffers the
		// whole request, so a file over the limit has to be turned away before it
		// is materialized in the isolate.
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

		const db = createDb(c.env.DB);
		const result = await attachCompanyDocument(
			db,
			c.env,
			c.get("user").id,
			slot,
			file,
		);

		if (result.status === "not_found") return apiNotFound(c, "Company");
		if (result.status === "verified") {
			return apiError(
				c,
				"INVALID_STATE",
				"A verified company's documents are not replaced here.",
			);
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
		if (result.status === "bad_slot") {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		return apiSuccess(
			c,
			{ verification: result.verification },
			"Certificate filed",
		);
	}),
);

verificationRoutes.delete(
	"/verification/documents/:slot",
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const slot = c.req.param("slot");
		if (!isCompanyDocumentSlot(slot)) {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		const db = createDb(c.env.DB);
		const result = await removeCompanyDocument(
			db,
			c.env,
			c.get("user").id,
			slot,
		);
		if (result.status === "not_found") return apiNotFound(c, "Certificate");
		if (result.status === "verified") {
			return apiError(
				c,
				"INVALID_STATE",
				"A verified company's documents are not removed here.",
			);
		}
		return apiSuccess(
			c,
			{ verification: result.verification },
			"Certificate removed",
		);
	}),
);

// ── read a filed certificate ──────────────────────────────
verificationRoutes.get(
	"/verification/documents/:slot",
	...factory.createHandlers(async (c) => {
		const slot = c.req.param("slot");
		if (!isCompanyDocumentSlot(slot)) {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		const db = createDb(c.env.DB);
		const result = await readCompanyDocument(db, c.env, c.get("user").id, slot);
		if (result.outcome === "not_found") return apiNotFound(c, "Certificate");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				// Shown rather than downloaded: the point of the certificate is to be
				// read, and the browser's own viewer is the one to read it in.
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);

// ── file the account for review ───────────────────────────
verificationRoutes.post(
	"/verification/submit",
	mutationRateLimit("business", "verification"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const result = await submitCompanyVerification(db, c.env, c.get("user").id);

		if (result.status === "not_found") return apiNotFound(c, "Company");
		if (result.status === "verified") {
			return apiError(c, "INVALID_STATE", "This company is already verified.");
		}
		if (result.status === "incomplete") {
			return apiError(
				c,
				"VALIDATION",
				`File the whole pack before submitting: ${result.missing.join(", ")}.`,
				{ fields: { missing: result.missing.join(", ") } },
			);
		}
		return apiSuccess(
			c,
			{ verification: result.verification },
			"Verification filed. An administrator will review it.",
		);
	}),
);
