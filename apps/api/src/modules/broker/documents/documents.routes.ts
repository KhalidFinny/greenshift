import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BrokerDocumentRequestBody } from "../../../contracts";
import { createDb } from "../../../db";
import { type DocumentCategory, documentCategories } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import {
	invalidOptionalText,
	MAX_NAME,
	MAX_TEXT,
	parseLimit,
} from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { documentReviewRoutes } from "./document-review.routes";
import {
	listDocumentRequests,
	loadDocumentContext,
	toDocumentRequest,
} from "./documents.repository";
import { createDocumentRequest } from "./documents.service";

const factory = createFactory<ApiEnv>();
const requestLimit = mutationRateLimit("broker", "document-request");

export const documentRoutes = new Hono<ApiEnv>();

const MAX_PERIOD = 100;

documentRoutes.get(
	"/document-requests",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listDocumentRequests(db, c.get("user").id, limit);

		const context = await loadDocumentContext(db, rows);
		return c.json({
			requests: rows.map((row) => {
				const entry = context.get(row.id);
				return toDocumentRequest(
					row,
					entry?.projectTitle ?? "Project",
					entry?.companyName ?? "Company",
				);
			}),
		});
	}),
);

documentRoutes.post(
	"/document-requests",
	requestLimit,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerDocumentRequestBody> | null;
		const {
			projectId,
			category,
			documentTypeName,
			reason,
			deadlineDate,
			requiredPeriod,
			additionalNotes,
		} = body ?? {};

		const deadline =
			typeof deadlineDate === "string" ? Date.parse(deadlineDate) : Number.NaN;
		if (
			typeof projectId !== "number" ||
			!Number.isInteger(projectId) ||
			projectId <= 0 ||
			typeof category !== "string" ||
			!documentCategories.includes(category as DocumentCategory) ||
			typeof documentTypeName !== "string" ||
			documentTypeName.trim().length === 0 ||
			documentTypeName.length > MAX_NAME ||
			typeof reason !== "string" ||
			reason.trim().length === 0 ||
			reason.length > MAX_TEXT ||
			Number.isNaN(deadline) ||
			invalidOptionalText(requiredPeriod, MAX_PERIOD) ||
			invalidOptionalText(additionalNotes, MAX_TEXT)
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await createDocumentRequest(db, {
			brokerId: c.get("user").id,
			userName: c.get("user").name,
			projectId,
			category: category as DocumentCategory,
			documentTypeName,
			requiredPeriod: requiredPeriod ?? null,
			reason,
			deadline: new Date(deadline),
			additionalNotes: additionalNotes ?? null,
		});
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Assignment");
		}
		if (result.outcome === "conflict") {
			return apiError(c, "CONFLICT", result.message);
		}

		return apiSuccess(
			c,
			{
				request: toDocumentRequest(
					result.request,
					result.project?.title ?? "Project",
					result.project?.companyName ?? "Company",
				),
			},
			"Changes saved successfully",
			201,
		);
	}),
);

documentRoutes.route("/", documentReviewRoutes);
