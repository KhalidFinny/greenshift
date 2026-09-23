import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { declaredBodyTooLarge, MULTIPART_ENVELOPE_SLACK } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	attachProposalDocument,
	MAX_PROPOSAL_DOCUMENT_BYTES,
	readVendorProposalDocument,
} from "./proposals.service";

const factory = createFactory<ApiEnv>();

export const proposalDocumentRoutes = new Hono<ApiEnv>();

// Multipart, like every upload: this router carries no `requireJsonBody`.
proposalDocumentRoutes.post(
	"/proposals/:id/document",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		// The declared length is read before the body is: `parseBody` buffers the whole request.
		if (
			declaredBodyTooLarge(
				c,
				MAX_PROPOSAL_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK,
			)
		) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The PDF must be 10 MB or smaller.",
			);
		}

		const body = await c.req.parseBody().catch(() => null);
		const file = body?.file;
		if (!(file instanceof File)) {
			return apiError(c, "VALIDATION", "Attach the PDF in the 'file' field.");
		}

		const db = createDb(c.env.DB);
		const result = await attachProposalDocument(
			db,
			c.env,
			c.get("user").id,
			id,
			file,
		);

		if (result.status === "not_found") return apiNotFound(c, "Proposal");
		if (result.status === "too_large") {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The PDF must be 10 MB or smaller.",
			);
		}
		if (result.status === "unsupported") {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The proposal document must be a PDF.",
			);
		}

		return apiSuccess(
			c,
			{ documentName: result.documentName },
			"Proposal document filed",
		);
	}),
);

proposalDocumentRoutes.get(
	"/proposals/:id/document",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await readVendorProposalDocument(
			db,
			c.env,
			c.get("user").id,
			id,
		);
		if (result.outcome === "not_found") return apiNotFound(c, "Document");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
