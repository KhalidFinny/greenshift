import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	BrokerDocumentRequest,
	BrokerDocumentRequestBody,
	BrokerDocumentReviewBody,
} from "../../../contracts";
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
import {
	type DocumentRequestRow,
	listDocumentRequests,
	loadDocumentContext,
} from "./documents.repository";
import {
	createDocumentRequest,
	reviewDocumentRequest,
} from "./documents.service";

const factory = createFactory<ApiEnv>();
const requestLimit = mutationRateLimit("broker", "document-request");
const reviewLimit = mutationRateLimit("broker", "document-review");

export const documentRoutes = new Hono<ApiEnv>();

const MAX_PERIOD = 100;

function toDocumentRequest(
	row: DocumentRequestRow,
	projectTitle: string,
	companyName: string,
): BrokerDocumentRequest {
	return {
		id: row.id,
		projectId: row.projectId,
		projectTitle,
		companyName,
		category: row.category,
		documentTypeName: row.documentTypeName,
		requiredPeriod: row.requiredPeriod,
		reason: row.reason,
		deadlineDate: row.deadlineDate
			? row.deadlineDate.toISOString().slice(0, 10)
			: null,
		additionalNotes: row.additionalNotes,
		status: row.status,
		submittedFileName: row.submittedFileName,
		submittedFileUrl: row.submittedFileUrl,
		submittedAt: row.submittedAt?.toISOString() ?? null,
		rejectionReason: row.rejectionReason,
		reviewedAt: row.reviewedAt?.toISOString() ?? null,
	};
}

// ── document requests (§15-§19) ───────────────────────────
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

documentRoutes.patch(
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
