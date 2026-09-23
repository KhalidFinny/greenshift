import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BrokerDocumentReviewBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidOptionalText, MAX_TEXT } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { loadDocumentContext, toDocumentRequest } from "./documents.repository";
import { reviewDocumentRequest } from "./documents.service";

const factory = createFactory<ApiEnv>();
const reviewLimit = mutationRateLimit("broker", "document-review");

export const documentReviewRoutes = new Hono<ApiEnv>();

documentReviewRoutes.patch(
	"/document-requests/:id",
	reviewLimit,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerDocumentReviewBody> | null;
		const action = body?.action;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			(action !== "START_REVIEW" &&
				action !== "APPROVE" &&
				action !== "REJECT") ||
			invalidOptionalText(body?.reason, MAX_TEXT)
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await reviewDocumentRequest(db, {
			brokerId: c.get("user").id,
			id,
			action,
			reason: body?.reason,
		});
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Document request");
		}
		if (result.outcome === "conflict") {
			return apiError(c, "CONFLICT", result.message);
		}
		if (result.outcome === "invalid") {
			return apiError(c, "VALIDATION", result.message);
		}

		const context = await loadDocumentContext(db, [result.request]);
		const entry = context.get(result.request.id);
		return apiSuccess(
			c,
			{
				request: toDocumentRequest(
					result.request,
					entry?.projectTitle ?? "Project",
					entry?.companyName ?? "Company",
				),
			},
			"Changes saved successfully",
		);
	}),
);
