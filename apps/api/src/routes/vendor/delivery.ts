import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../db";
import {
	auditLogs,
	evidenceKinds,
	milestoneEvidence,
	projectMilestones,
	projects,
	proposals,
	tenders,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import { evidenceEntry, milestoneEntry, mutationRateLimit } from "./helpers";

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

// Attach delivery evidence to a milestone of an awarded project. Uploading
// sends the milestone back for company review unless it is already approved.
deliveryRoutes.post(
	"/milestones/:id/evidence",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "milestone");
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
		const userId = c.get("user").id;

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Milestone not found" } },
				404,
			);
		}

		const [row] = await db
			.select({ milestone: projectMilestones, projectId: projects.id })
			.from(projectMilestones)
			.innerJoin(projects, eq(projectMilestones.projectId, projects.id))
			.where(eq(projectMilestones.id, id))
			.limit(1);
		if (!row) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Milestone not found" } },
				404,
			);
		}

		// Only the vendor whose proposal was accepted on this project may upload.
		const [awarded] = await db
			.select({ id: proposals.id })
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.where(
				and(
					eq(tenders.projectId, row.projectId),
					eq(proposals.vendorId, profile.id),
					eq(proposals.status, "accepted"),
				),
			)
			.limit(1);
		if (!awarded) {
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

		const [inserted] = await db
			.insert(milestoneEvidence)
			.values({
				milestoneId: id,
				kind: kind as (typeof evidenceKinds)[number],
				fileName,
				fileUrl: body?.fileUrl ?? null,
				notes: body?.notes ?? null,
			})
			.returning();
		if (!inserted) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to add evidence" } },
				500,
			);
		}

		if (row.milestone.status !== "APPROVED") {
			await db
				.update(projectMilestones)
				.set({ status: "SUBMITTED_FOR_REVIEW" })
				.where(eq(projectMilestones.id, id));
		}

		await db.insert(auditLogs).values({
			userId,
			projectId: row.projectId,
			action: "milestone.evidence.uploaded",
			entityType: "milestone_evidence",
			entityId: inserted.id,
			metadata: { milestoneId: id, fileName },
		});

		const evidence = await db
			.select()
			.from(milestoneEvidence)
			.where(eq(milestoneEvidence.milestoneId, id))
			.orderBy(milestoneEvidence.uploadedAt);

		const [milestone] = await db
			.select()
			.from(projectMilestones)
			.where(eq(projectMilestones.id, id))
			.limit(1);

		return c.json(
			{
				evidence: evidenceEntry(inserted),
				milestone: milestone ? milestoneEntry(milestone, evidence) : null,
			},
			201,
		);
	}),
);
