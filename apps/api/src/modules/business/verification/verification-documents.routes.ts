// Filing, reading and removing one certificate. Multipart, so `requireJsonBody` is not on this router.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
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
	readCompanyDocument,
	removeCompanyDocument,
} from "./verification-documents.service";
import { isCompanyDocumentSlot } from "./verification-pack.service";

const factory = createFactory<ApiEnv>();

export const verificationDocumentRoutes = new Hono<ApiEnv>();

verificationDocumentRoutes.post(
	"/verification/documents/:slot",
	mutationRateLimit("business", "verification"),
	...factory.createHandlers(async (c) => {
		const slot = c.req.param("slot");
		if (!isCompanyDocumentSlot(slot)) {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		// `parseBody` buffers the whole request, so the declared length has to turn a big file away first.
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

verificationDocumentRoutes.delete(
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

verificationDocumentRoutes.get(
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
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
