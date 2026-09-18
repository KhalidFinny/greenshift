import { and, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	type evidenceKinds,
	milestoneEvidence,
	projectMilestones,
	projects,
	proposals,
	tenders,
} from "../../../db/schema";

export async function findMilestoneWithProject(
	db: GreenShiftDb,
	milestoneId: number,
) {
	const [row] = await db
		.select({ milestone: projectMilestones, projectId: projects.id })
		.from(projectMilestones)
		.innerJoin(projects, eq(projectMilestones.projectId, projects.id))
		.where(eq(projectMilestones.id, milestoneId))
		.limit(1);

	return row;
}

// Only the vendor whose proposal was accepted on this project may upload.
export async function findAwardedProposalId(
	db: GreenShiftDb,
	projectId: number,
	vendorId: number,
) {
	const [awarded] = await db
		.select({ id: proposals.id })
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.where(
			and(
				eq(tenders.projectId, projectId),
				eq(proposals.vendorId, vendorId),
				eq(proposals.status, "accepted"),
			),
		)
		.limit(1);

	return awarded;
}

export async function insertMilestoneEvidence(
	db: GreenShiftDb,
	values: {
		milestoneId: number;
		kind: string;
		fileName: string;
		fileUrl: string | null;
		notes: string | null;
	},
) {
	const [inserted] = await db
		.insert(milestoneEvidence)
		.values({
			milestoneId: values.milestoneId,
			kind: values.kind as (typeof evidenceKinds)[number],
			fileName: values.fileName,
			fileUrl: values.fileUrl,
			notes: values.notes,
		})
		.returning();

	return inserted;
}

export async function setMilestoneStatus(
	db: GreenShiftDb,
	id: number,
	status: (typeof projectMilestones.$inferInsert)["status"],
): Promise<void> {
	await db
		.update(projectMilestones)
		.set({ status })
		.where(eq(projectMilestones.id, id));
}

export async function listMilestoneEvidence(
	db: GreenShiftDb,
	milestoneId: number,
) {
	return db
		.select()
		.from(milestoneEvidence)
		.where(eq(milestoneEvidence.milestoneId, milestoneId))
		.orderBy(milestoneEvidence.uploadedAt);
}

export async function findMilestone(db: GreenShiftDb, id: number) {
	const [milestone] = await db
		.select()
		.from(projectMilestones)
		.where(eq(projectMilestones.id, id))
		.limit(1);

	return milestone;
}
