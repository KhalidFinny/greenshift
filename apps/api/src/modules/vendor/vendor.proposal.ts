import { and, eq } from "drizzle-orm";
import type {
	ProposalDetail,
	ProposalRevisionEntry,
	ProposalSummary,
} from "../../contracts";
import { apiRoutes } from "../../contracts";
import type { GreenShiftDb } from "../../db";
import {
	organizationName,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
} from "../../db/schema";
import { iso } from "../../lib/format";
import { tenderSummary } from "./vendor.tender";

export function proposalSummary(
	p: typeof proposals.$inferSelect,
	project: { id: number; title: string },
	tender: { status: string; deadlineAt: Date | null },
): ProposalSummary {
	return {
		id: p.id,
		tenderId: p.tenderId,
		projectId: project.id,
		projectTitle: project.title,
		amount: p.amount,
		status: p.status,
		revisionCount: p.revisionCount ?? 0,
		documentName: p.documentName,
		documentUrl: p.documentKey
			? apiRoutes.vendorProposalDocumentFile.path.replace(":id", String(p.id))
			: null,
		submittedAt: iso(p.submittedAt),
		tenderStatus: tender.status,
		tenderDeadlineAt: iso(tender.deadlineAt),
	};
}

export function revisionEntry(
	r: typeof proposalRevisions.$inferSelect,
): ProposalRevisionEntry {
	return {
		id: r.id,
		revisionNumber: r.revisionNumber,
		note: r.note,
		amount: r.amount,
		previousAmount: r.previousAmount,
		createdBy: r.createdBy,
		createdAt: iso(r.createdAt),
	};
}

/** Owner-scoped full proposal detail (proposal + tender + project + revisions). */
export async function getProposalDetail(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
): Promise<ProposalDetail | null> {
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
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.limit(1);
	if (!row) return null;

	const revisions = await db
		.select()
		.from(proposalRevisions)
		.where(eq(proposalRevisions.proposalId, proposalId))
		.orderBy(proposalRevisions.revisionNumber);

	return {
		id: row.proposal.id,
		amount: row.proposal.amount,
		technicalSpec: row.proposal.technicalSpec,
		operationalCost: row.proposal.operationalCost,
		projectedRoi: row.proposal.projectedRoi,
		warrantyPeriod: row.proposal.warrantyPeriod,
		status: row.proposal.status,
		revisionCount: row.proposal.revisionCount ?? 0,
		documentName: row.proposal.documentName,
		documentUrl: row.proposal.documentKey
			? apiRoutes.vendorProposalDocumentFile.path.replace(
					":id",
					String(row.proposal.id),
				)
			: null,
		submittedAt: iso(row.proposal.submittedAt),
		reviewedAt: iso(row.proposal.reviewedAt),
		tender: tenderSummary(row.tender),
		project: {
			id: row.project.id,
			title: row.project.title,
			description: row.project.description,
			status: row.project.status,
			companyName: row.companyName,
			location: row.project.location,
			industrySector: row.project.industrySector,
			budget: row.project.budget,
		},
		revisions: revisions.map(revisionEntry),
	};
}
