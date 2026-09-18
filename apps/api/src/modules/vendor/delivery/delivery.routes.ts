import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import { evidenceKinds } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
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
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "milestone")(c);
		if (rateError) return rateError;

		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
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
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid evidence input" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const result = await addMilestoneEvidence(db, c.get("user").id, id, {
			kind,
			fileName,
			fileUrl: body?.fileUrl ?? null,
			notes: body?.notes ?? null,
		});

		if (result.status === "not_found") {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Milestone not found" } },
				404,
			);
		}
		if (result.status === "forbidden") {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "No awarded proposal on this project",
					},
				},
				403,
			);
		}
		if (result.status === "insert_failed") {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to add evidence" } },
				500,
			);
		}
		return c.json(
			{ evidence: result.evidence, milestone: result.milestone },
			201,
		);
	}),
);
