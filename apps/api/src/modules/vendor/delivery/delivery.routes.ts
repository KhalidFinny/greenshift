import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import { evidenceKinds } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { addMilestoneEvidence } from "./delivery.service";

const factory = createFactory<ApiEnv>();

export const deliveryRoutes = new Hono<ApiEnv>();

const MAX_TEXT_LENGTH = 2000;
const MAX_FILE_NAME_LENGTH = 255;

interface EvidenceBody {
	kind?: string;
	fileName?: string;
	fileUrl?: string;
	notes?: string;
	templateId?: string;
}

deliveryRoutes.post(
	"/milestones/:id/evidence",
	mutationRateLimit("vendor", "milestone"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const body = (await c.req.json().catch(() => null)) as EvidenceBody | null;
		const fileName = body?.fileName?.trim();
		const kind = body?.kind ?? "document";

		if (
			!fileName ||
			fileName.length > MAX_FILE_NAME_LENGTH ||
			!(evidenceKinds as readonly string[]).includes(kind) ||
			(body?.notes !== undefined &&
				(typeof body.notes !== "string" || body.notes.length > MAX_TEXT_LENGTH))
		) {
			return apiError(c, "VALIDATION", "Invalid evidence input");
		}

		const db = createDb(c.env.DB);
		const result = await addMilestoneEvidence(db, c.get("user").id, id, {
			kind,
			fileName,
			fileUrl: body?.fileUrl ?? null,
			notes: body?.notes ?? null,
		});

		if (result.status === "not_found") {
			return apiNotFound(c, "Milestone");
		}
		if (result.status === "forbidden") {
			return apiError(c, "FORBIDDEN", "No awarded proposal on this project");
		}
		if (result.status === "insert_failed") {
			return apiError(c, "INTERNAL", "Failed to add evidence");
		}
		return apiSuccess(
			c,
			{ evidence: result.evidence, milestone: result.milestone },
			"Changes saved successfully",
			201,
		);
	}),
);
