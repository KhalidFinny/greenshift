import { and, desc, eq, inArray } from "drizzle-orm";
import type {
	BrokerMilestone,
	BrokerProjectDocument,
	BrokerRiskAssessment,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	documentRequests,
	emissionReports,
	projectDocuments,
	projectMilestones,
	proposals,
	riskAssessments,
	tenders,
	users,
	vendors,
} from "../../../db/schema";
import { isoDate } from "../../../lib/format";
import {
	toMilestone,
	toProjectDocument,
	toRiskAssessment,
} from "../broker.shared";

export interface ProjectContext {
	vendorName: string | null;
	contractValue: number | null;
	proposalRoi: number | null;
	blueprintStatus: string | null;
	blueprintValidatedAt: Date | null;
	financialProjections: {
		irrPercent: number | null;
		npvAmount: number | null;
		paybackYears: number | null;
	};
	risk: BrokerRiskAssessment;
	documents: BrokerProjectDocument[];
	milestones: BrokerMilestone[];
	outstandingRequestsCount: number;
	lastReportDate: string | null;
}

/** Loads the financing context of many projects at once: awarded vendor, blueprint, risk, documents, milestones, open requests and last report. */
export async function loadProjectContext(
	db: GreenShiftDb,
	projectIds: number[],
): Promise<Map<number, ProjectContext>> {
	const context = new Map<number, ProjectContext>();
	if (projectIds.length === 0) return context;

	for (const projectId of projectIds) {
		context.set(projectId, {
			vendorName: null,
			contractValue: null,
			proposalRoi: null,
			blueprintStatus: null,
			blueprintValidatedAt: null,
			financialProjections: {
				irrPercent: null,
				npvAmount: null,
				paybackYears: null,
			},
			risk: toRiskAssessment(undefined),
			documents: [],
			milestones: [],
			outstandingRequestsCount: 0,
			lastReportDate: null,
		});
	}

	// The awarded proposal determines the vendor, the contract value and the ROI.
	const awarded = await db
		.select({
			projectId: tenders.projectId,
			amount: proposals.amount,
			projectedRoi: proposals.projectedRoi,
			vendorName: vendors.companyName,
			vendorUserName: users.name,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.leftJoin(vendors, eq(proposals.vendorId, vendors.id))
		.leftJoin(users, eq(proposals.vendorId, users.id))
		.where(
			and(
				inArray(tenders.projectId, projectIds),
				eq(proposals.status, "accepted"),
			),
		)
		.orderBy(desc(proposals.submittedAt));
	for (const row of awarded) {
		const entry = context.get(row.projectId);
		if (!entry || entry.vendorName) continue;
		entry.vendorName = row.vendorName ?? row.vendorUserName ?? null;
		entry.contractValue = row.amount ?? null;
		entry.proposalRoi = row.projectedRoi ?? null;
	}

	// Latest blueprint per project: LVV GRK validation and financial projections.
	const blueprintRows = await db
		.select()
		.from(blueprints)
		.where(inArray(blueprints.projectId, projectIds))
		.orderBy(desc(blueprints.createdAt));
	for (const row of blueprintRows) {
		const entry = context.get(row.projectId);
		if (!entry || entry.blueprintStatus) continue;
		entry.blueprintStatus = row.status;
		entry.blueprintValidatedAt = row.validatedAt;
		const projections = (
			row.document as {
				financialProjections?: {
					npv?: number;
					irr?: number;
					paybackPeriod?: number;
				};
			} | null
		)?.financialProjections;
		entry.financialProjections = {
			irrPercent: projections?.irr ?? null,
			npvAmount: projections?.npv ?? null,
			paybackYears: projections?.paybackPeriod ?? null,
		};
	}

	const riskRows = await db
		.select()
		.from(riskAssessments)
		.where(inArray(riskAssessments.projectId, projectIds))
		.orderBy(desc(riskAssessments.assessedAt));
	for (const row of riskRows) {
		const entry = context.get(row.projectId);
		if (!entry || entry.risk.overallRiskLevel) continue;
		entry.risk = toRiskAssessment(row);
	}

	const documentRows = await db
		.select()
		.from(projectDocuments)
		.where(inArray(projectDocuments.projectId, projectIds))
		.orderBy(desc(projectDocuments.uploadedAt));
	for (const row of documentRows) {
		context.get(row.projectId)?.documents.push(toProjectDocument(row));
	}

	const milestoneRows = await db
		.select()
		.from(projectMilestones)
		.where(inArray(projectMilestones.projectId, projectIds))
		.orderBy(projectMilestones.stepNumber);
	for (const row of milestoneRows) {
		context.get(row.projectId)?.milestones.push(toMilestone(row));
	}

	const requestRows = await db
		.select({
			projectId: documentRequests.projectId,
			status: documentRequests.status,
		})
		.from(documentRequests)
		.where(inArray(documentRequests.projectId, projectIds));
	for (const row of requestRows) {
		const entry = context.get(row.projectId);
		if (!entry) continue;
		if (
			row.status === "REQUESTED" ||
			row.status === "REJECTED" ||
			row.status === "RESUBMISSION"
		) {
			entry.outstandingRequestsCount += 1;
		}
	}

	const reportRows = await db
		.select({
			projectId: emissionReports.projectId,
			periodStart: emissionReports.periodStart,
			createdAt: emissionReports.createdAt,
		})
		.from(emissionReports)
		.where(inArray(emissionReports.projectId, projectIds))
		.orderBy(desc(emissionReports.createdAt));
	for (const row of reportRows) {
		const entry = context.get(row.projectId);
		if (!entry || entry.lastReportDate) continue;
		entry.lastReportDate = isoDate(row.periodStart ?? row.createdAt);
	}

	return context;
}
