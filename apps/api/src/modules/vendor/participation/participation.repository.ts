import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	emissionReports,
	energyForecasts,
	milestoneEvidence,
	organizationName,
	projectMilestones,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
} from "../../../db/schema";

/** The vendor's proposals, newest first, with tender + project context. */
export async function listVendorProposalRows(
	db: GreenShiftDb,
	vendorId: number,
	limit: number,
) {
	return db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
			companyName: organizationName,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(eq(proposals.vendorId, vendorId))
		.orderBy(desc(proposals.submittedAt))
		.limit(limit);
}

/** The vendor's (latest) proposal on one project. */
export async function findVendorProjectRow(
	db: GreenShiftDb,
	vendorId: number,
	projectId: number,
) {
	const [row] = await db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
			companyName: organizationName,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(and(eq(proposals.vendorId, vendorId), eq(projects.id, projectId)))
		.orderBy(desc(proposals.submittedAt))
		.limit(1);

	return row;
}

export async function listProjectMilestones(
	db: GreenShiftDb,
	projectIds: number[],
): Promise<Array<typeof projectMilestones.$inferSelect>> {
	return db
		.select()
		.from(projectMilestones)
		.where(inArray(projectMilestones.projectId, projectIds))
		.orderBy(projectMilestones.stepNumber);
}

export async function listMilestoneEvidence(
	db: GreenShiftDb,
	milestoneIds: number[],
): Promise<Array<typeof milestoneEvidence.$inferSelect>> {
	if (!milestoneIds.length) return [];
	return db
		.select()
		.from(milestoneEvidence)
		.where(inArray(milestoneEvidence.milestoneId, milestoneIds))
		.orderBy(milestoneEvidence.uploadedAt);
}

export async function listEmissionReports(
	db: GreenShiftDb,
	projectIds: number[],
): Promise<Array<typeof emissionReports.$inferSelect>> {
	return db
		.select()
		.from(emissionReports)
		.where(inArray(emissionReports.projectId, projectIds))
		.orderBy(desc(emissionReports.periodStart));
}

/**
 * Predictive-analytics periods for the projects, newest first. Read-only: the
 * forecast is produced by the model, never by the vendor or the company.
 */
export async function listEnergyForecasts(
	db: GreenShiftDb,
	projectIds: number[],
): Promise<Array<typeof energyForecasts.$inferSelect>> {
	return db
		.select()
		.from(energyForecasts)
		.where(inArray(energyForecasts.projectId, projectIds))
		.orderBy(desc(energyForecasts.periodStart));
}

export async function listProposalRevisions(
	db: GreenShiftDb,
	proposalId: number,
) {
	return db
		.select()
		.from(proposalRevisions)
		.where(eq(proposalRevisions.proposalId, proposalId))
		.orderBy(proposalRevisions.revisionNumber);
}

/** Proposal-centric pipeline rows, with the latest revision note. */
export async function listProcurementRows(
	db: GreenShiftDb,
	vendorId: number,
	limit: number,
) {
	return db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
			companyName: organizationName,
			latestNote: sql<
				string | null
			>`(select note from proposal_revisions pr where pr.proposal_id = proposals.id order by pr.id desc limit 1)`,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(eq(proposals.vendorId, vendorId))
		.orderBy(desc(proposals.submittedAt))
		.limit(limit);
}
