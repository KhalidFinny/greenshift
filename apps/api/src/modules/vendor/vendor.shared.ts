import { and, eq } from "drizzle-orm";
import type {
	ProposalDetail,
	ProposalRevisionEntry,
	VendorEnergyForecast,
	VendorMilestone,
	VendorMilestoneEvidence,
	VendorMonthlyReport,
	VendorTenderSummary,
} from "../../contracts";
import type { GreenShiftDb } from "../../db";
import {
	auditLogs,
	type emissionReports,
	type energyForecasts,
	type milestoneEvidence,
	type projectMilestones,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
	vendors,
} from "../../db/schema";
import { iso } from "../../lib/format";

// Caps shared by more than one vendor feature.
export const MAX_SPEC_LENGTH = 5000;
export const MAX_WARRANTY_MONTHS = 240;

/** Vendor profile id for an authenticated user, or null when none exists yet. */
export async function vendorProfileId(
	db: GreenShiftDb,
	userId: number,
): Promise<number | null> {
	const [profile] = await db
		.select({ id: vendors.id })
		.from(vendors)
		.where(eq(vendors.userId, userId))
		.limit(1);
	return profile?.id ?? null;
}

/** Audit-trail write shared by the vendor feature services. */
export async function recordAudit(
	db: GreenShiftDb,
	entry: typeof auditLogs.$inferInsert,
): Promise<void> {
	await db.insert(auditLogs).values(entry);
}

export function tenderSummary(
	t: typeof tenders.$inferSelect,
): VendorTenderSummary {
	return {
		id: t.id,
		method: t.method,
		status: t.status,
		budgetMin: t.budgetMin,
		budgetMax: t.budgetMax,
		deadlineAt: iso(t.deadlineAt),
		awardedProposalId: t.awardedProposalId,
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

// Owner-scoped full proposal detail (proposal + tender + project + revisions).
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
			companyName: users.name,
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

// ── delivery mappers ──────────────────────────────────────
export function evidenceEntry(
	row: typeof milestoneEvidence.$inferSelect,
): VendorMilestoneEvidence {
	return {
		id: row.id,
		kind: row.kind,
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		notes: row.notes,
		uploadedAt: row.uploadedAt.toISOString(),
	};
}

export function milestoneEntry(
	row: typeof projectMilestones.$inferSelect,
	evidence: Array<typeof milestoneEvidence.$inferSelect>,
): VendorMilestone {
	return {
		id: row.id,
		stepNumber: row.stepNumber,
		title: row.title,
		description: row.description,
		startDate: iso(row.startDate),
		dueDate: iso(row.dueDate),
		completionPercent: row.completionPercent ?? 0,
		status: row.status,
		vendorNotes: row.vendorNotes,
		companyReviewNotes: row.companyReviewNotes,
		evidence: evidence.map(evidenceEntry),
	};
}

export function forecastEntry(
	row: typeof energyForecasts.$inferSelect,
): VendorEnergyForecast {
	return {
		periodStart: iso(row.periodStart),
		periodEnd: iso(row.periodEnd),
		forecastedConsumption: row.forecastedConsumption,
		forecastedSavings: row.forecastedSavings,
		modelName: row.modelName,
		metrics: row.metrics ?? null,
	};
}

export function monthlyReportEntry(
	row: typeof emissionReports.$inferSelect,
): VendorMonthlyReport {
	const reportData = row.reportData as { evidenceDocs?: string[] } | null;
	const saved =
		row.baselineConsumption !== null && row.actualConsumption !== null
			? row.baselineConsumption - row.actualConsumption
			: null;
	return {
		id: row.id,
		projectId: row.projectId,
		period: row.periodStart
			? row.periodStart.toISOString().slice(0, 7)
			: row.createdAt.toISOString().slice(0, 7),
		periodStart: iso(row.periodStart),
		periodEnd: iso(row.periodEnd),
		actualConsumption: row.actualConsumption,
		baselineConsumption: row.baselineConsumption,
		energySavedKwh: saved,
		carbonSavedTons: row.emissionReduction,
		evidenceDocs: reportData?.evidenceDocs ?? [],
		submittedAt: row.createdAt.toISOString(),
	};
}
