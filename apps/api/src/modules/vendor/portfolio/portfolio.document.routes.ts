import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import {
	declaredBodyTooLarge,
	MULTIPART_ENVELOPE_SLACK,
} from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	attachVendorPortfolioDocument,
	MAX_PORTFOLIO_DOCUMENT_BYTES,
	readVendorPortfolioDocument,
} from "./portfolio.service";

const factory = createFactory<ApiEnv>();

export const portfolioDocumentRoutes = new Hono<ApiEnv>();

// Multipart, like every upload: this router carries no `requireJsonBody`.
portfolioDocumentRoutes.post(
	"/portfolio/:id/document",
	mutationRateLimit("vendor", "portfolio"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		// The declared length is read before the body is: `parseBody` buffers the whole request.
		if (
			declaredBodyTooLarge(
				c,
				MAX_PORTFOLIO_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK,
			)
		) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The file must be 10 MB or smaller.",
			);
		}

		const body = await c.req.parseBody().catch(() => null);
		const file = body?.file;
		if (!(file instanceof File)) {
			return apiError(c, "VALIDATION", "Attach the file in the 'file' field.");
		}

		const db = createDb(c.env.DB);
		const result = await attachVendorPortfolioDocument(
			db,
			c.env,
			c.get("user").id,
			id,
			file,
		);

		if (result.status === "not_found") return apiNotFound(c, "Portfolio item");
		if (result.status === "too_large") {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The file must be 10 MB or smaller.",
			);
		}
		if (result.status === "unsupported") {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The file must be PDF, Word, PNG, JPG, or WebP.",
			);
		}

		return apiSuccess(c, { item: result.item }, "Document attached");
	}),
);

portfolioDocumentRoutes.get(
	"/portfolio/:id/document",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await readVendorPortfolioDocument(
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
