import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorPortfolioBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	addVendorPortfolioItem,
	attachVendorPortfolioDocument,
	listVendorPortfolio,
	MAX_PORTFOLIO_DOCUMENT_BYTES,
	readVendorPortfolioDocument,
	removeVendorPortfolioItem,
} from "./portfolio.service";

const factory = createFactory<ApiEnv>();

export const portfolioRoutes = new Hono<ApiEnv>();

const MAX_TEXT_LENGTH = 2000;

/**
 * What the multipart envelope around one file costs: the boundaries and part
 * headers. The gate has to allow for it or a file at the limit is refused.
 */
const MULTIPART_ENVELOPE_SLACK = 8 * 1024;

portfolioRoutes.get(
	"/portfolio",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const portfolio = await listVendorPortfolio(db, c.get("user").id);
		return c.json({ portfolio });
	}),
);

portfolioRoutes.post(
	"/portfolio",
	mutationRateLimit("vendor", "portfolio"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as VendorPortfolioBody | null;
		const projectName = body?.projectName?.trim();
		const clientName = body?.clientName?.trim();
		const projectValue = body?.projectValue;

		if (
			!projectName ||
			!clientName ||
			projectName.length > 200 ||
			clientName.length > 200 ||
			typeof projectValue !== "number" ||
			!Number.isFinite(projectValue) ||
			projectValue <= 0 ||
			invalidNumber(body?.durationMonths, {
				integer: true,
				min: 0,
				max: 600,
			}) ||
			invalidNumber(body?.energySavingPercent, { min: 0, max: 100 }) ||
			invalidNumber(body?.carbonReductionTons, { min: 0 }) ||
			invalidNumber(body?.completionYear, {
				integer: true,
				min: 1900,
				max: 2200,
			}) ||
			(body?.description !== undefined &&
				(typeof body.description !== "string" ||
					body.description.length > MAX_TEXT_LENGTH)) ||
			(body?.servicesProvided !== undefined &&
				(typeof body.servicesProvided !== "string" ||
					body.servicesProvided.length > MAX_TEXT_LENGTH))
		) {
			return apiError(c, "VALIDATION", "Invalid portfolio item");
		}

		const db = createDb(c.env.DB);
		const result = await addVendorPortfolioItem(db, c.get("user").id, {
			projectName,
			clientName,
			projectValue,
			details: body,
		});
		if (result.status === "no_profile") {
			return apiError(
				c,
				"VALIDATION",
				"Complete your vendor profile before adding portfolio items",
			);
		}
		if (result.status === "insert_failed") {
			return apiError(c, "INTERNAL", "Failed to add item");
		}
		return apiSuccess(
			c,
			{ item: result.item },
			"Changes saved successfully",
			201,
		);
	}),
);

portfolioRoutes.delete(
	"/portfolio/:id",
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await removeVendorPortfolioItem(
			db,
			c.env,
			c.get("user").id,
			id,
		);
		if (result.status === "not_found") {
			return apiNotFound(c, "Portfolio item");
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);

// Multipart, like every upload: this router carries no `requireJsonBody`, so the
// JSON mutations guard themselves and this route takes the file as it is.
portfolioRoutes.post(
	"/portfolio/:id/document",
	mutationRateLimit("vendor", "portfolio"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		// The declared length is read before the body is: `parseBody` buffers the whole
		// request, so an oversized file is turned away before it is materialized.
		const declared = Number(c.req.header("content-length") ?? "0");
		if (
			Number.isFinite(declared) &&
			declared > MAX_PORTFOLIO_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK
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

portfolioRoutes.get(
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
				// Shown rather than downloaded: the browser's own viewer is the one to read it in.
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
