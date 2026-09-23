import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { validDraftId } from "../business.shared";
import * as draftsRepository from "../drafts/drafts.repository";
import * as projectsRepository from "../projects/projects.repository";
import {
	deleteDraftDocument,
	listProjectDocuments,
	readProjectDocument,
	uploadDraftDocument,
} from "./documents.service";

const factory = createFactory<ApiEnv>();

export const documentsRoutes = new Hono<ApiEnv>();

function numericId(raw: string | undefined): number | null {
	if (!raw || !/^\d+$/.test(raw)) return null;
	const value = Number(raw);
	return Number.isSafeInteger(value) ? value : null;
}

// Multipart rather than JSON: `requireJsonBody` caps bodies at 16 KB and a scanned document is far larger.
documentsRoutes.post(
	"/drafts/:draftId/documents",
	mutationRateLimit("business", "document"),
	...factory.createHandlers(async (c) => {
		const draftId = c.req.param("draftId");
		if (!validDraftId(draftId)) {
			return apiError(c, "VALIDATION", "Invalid draft id.");
		}
		const db = createDb(c.env.DB);

		// Scoped lookup first: another company's draft answers "not found".
		const draft = await draftsRepository.findDraft(
			db,
			draftId,
			c.get("user").id,
		);
		if (!draft) return apiNotFound(c, "Draft");

		const body = await c.req.parseBody().catch(() => null);
		const file = body?.file;
		const slot = body?.slot;

		if (!(file instanceof File) || typeof slot !== "string") {
			return apiError(
				c,
				"VALIDATION",
				"Attach the file in the 'file' field together with 'slot'.",
			);
		}

		const result = await uploadDraftDocument(db, c.env, draftId, file, slot);

		if (result.outcome === "invalid_slot") {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}
		if (result.outcome === "too_large") {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The file must be 25 MB or smaller.",
			);
		}
		if (result.outcome === "unsupported") {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The file must be PDF, Excel, PNG, or JPG.",
			);
		}
		if (result.outcome !== "ok") return apiError(c, "INTERNAL");

		return apiSuccess(c, { document: result.document }, undefined, 201);
	}),
);

documentsRoutes.delete(
	"/drafts/:draftId/documents/:docId",
	mutationRateLimit("business", "document"),
	...factory.createHandlers(async (c) => {
		const draftId = c.req.param("draftId");
		if (!validDraftId(draftId)) {
			return apiError(c, "VALIDATION", "Invalid draft id.");
		}
		const db = createDb(c.env.DB);

		const draft = await draftsRepository.findDraft(
			db,
			draftId,
			c.get("user").id,
		);
		if (!draft) return apiNotFound(c, "Draft");

		const docId = c.req.param("docId");
		if (!docId || docId.includes("/")) {
			return apiError(c, "VALIDATION", "Invalid document.");
		}

		const result = await deleteDraftDocument(db, c.env, draftId, docId);
		if (result.outcome === "not_found") return apiNotFound(c, "Document");

		return apiSuccess(c, { ok: true });
	}),
);

documentsRoutes.get(
	"/projects/:id/documents",
	...factory.createHandlers(async (c) => {
		const projectId = numericId(c.req.param("id"));
		if (projectId === null) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const project = await projectsRepository.findCompanyProject(
			db,
			projectId,
			c.get("user").id,
		);
		if (!project) return apiNotFound(c, "Project");

		const documents = await listProjectDocuments(db, projectId);
		return c.json({ documents });
	}),
);

documentsRoutes.get(
	"/projects/:id/documents/:docId/download",
	...factory.createHandlers(async (c) => {
		const projectId = numericId(c.req.param("id"));
		const docId = numericId(c.req.param("docId"));
		if (projectId === null || docId === null) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const project = await projectsRepository.findCompanyProject(
			db,
			projectId,
			c.get("user").id,
		);
		if (!project) return apiNotFound(c, "Project");

		const result = await readProjectDocument(db, c.env, projectId, docId);
		if (result.outcome === "not_found") return apiNotFound(c, "Document");
		if (result.outcome === "not_ready") {
			return apiError(
				c,
				"NOT_READY",
				"Berkas masih diproses, coba lagi sebentar lagi.",
			);
		}

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `attachment; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
