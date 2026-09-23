import type {
	VendorMyProject,
	VendorMyProjectDetail,
	VendorProcurementStatusItem,
} from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	forecastEntry,
	milestoneEntry,
	monthlyReportEntry,
	revisionEntry,
	tenderSummary,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./participation.repository";

export async function listMyProjects(
	db: GreenShiftDb,
	userId: number,
	limit: number,
): Promise<VendorMyProject[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listVendorProposalRows(db, vendorId, limit);

	// One row per project, keeping the latest proposal when a project was tendered twice.
	const byProject = new Map<number, VendorMyProject>();
	for (const { proposal, tender, project, companyName } of rows) {
		if (byProject.has(project.id)) continue;
		byProject.set(project.id, {
			project: {
				id: project.id,
				title: project.title,
				status: project.status,
				companyName,
				location: project.location,
				industrySector: project.industrySector,
				budget: project.budget,
				targetEmissionReduction: project.targetEmissionReduction,
				estimatedEnergySaving: project.estimatedEnergySaving,
			},
			tender: tenderSummary(tender),
			proposal: {
				id: proposal.id,
				amount: proposal.amount,
				status: proposal.status,
				revisionCount: proposal.revisionCount ?? 0,
				documentName: proposal.documentName,
				documentUrl: proposal.documentKey
					? apiRoutes.vendorProposalDocumentFile.path.replace(
							":id",
							String(proposal.id),
						)
					: null,
				submittedAt: iso(proposal.submittedAt),
			},
		});
	}

	// Delivery data for this page's projects, so the views need no request per project.
	const projects_ = [...byProject.values()];
	const projectIds = projects_.map((item) => item.project.id);
	if (projectIds.length) {
		const milestoneRows = await repository.listProjectMilestones(
			db,
			projectIds,
		);

		const milestoneIds = milestoneRows.map((milestone) => milestone.id);
		const evidenceRows = await repository.listMilestoneEvidence(
			db,
			milestoneIds,
		);

		const reportRows = await repository.listEmissionReports(db, projectIds);
		const forecastRows = await repository.listEnergyForecasts(db, projectIds);

		for (const item of projects_) {
			item.milestones = milestoneRows
				.filter((milestone) => milestone.projectId === item.project.id)
				.map((milestone) =>
					milestoneEntry(
						milestone,
						evidenceRows.filter(
							(evidence) => evidence.milestoneId === milestone.id,
						),
					),
				);
			item.monthlyReports = reportRows
				.filter((report) => report.projectId === item.project.id)
				.map(monthlyReportEntry);
			item.forecasts = forecastRows
				.filter((forecast) => forecast.projectId === item.project.id)
				.map(forecastEntry);
		}
	}

	return projects_;
}

export async function getMyProject(
	db: GreenShiftDb,
	userId: number,
	id: number,
): Promise<VendorMyProjectDetail | null> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return null;

	const row = await repository.findVendorProjectRow(db, vendorId, id);
	if (!row) return null;

	const revisions = await repository.listProposalRevisions(db, row.proposal.id);

	// Delivery state: milestones with their evidence, plus the MRV reports the vendor filed.
	const milestoneRows = await repository.listProjectMilestones(db, [
		row.project.id,
	]);

	const milestoneIds = milestoneRows.map((milestone) => milestone.id);
	const evidenceRows = await repository.listMilestoneEvidence(db, milestoneIds);

	const reportRows = await repository.listEmissionReports(db, [row.project.id]);
	const forecastRows = await repository.listEnergyForecasts(db, [
		row.project.id,
	]);

	return {
		id: row.project.id,
		title: row.project.title,
		description: row.project.description,
		status: row.project.status,
		companyName: row.companyName,
		location: row.project.location,
		industrySector: row.project.industrySector,
		budget: row.project.budget,
		tender: tenderSummary(row.tender),
		proposal: {
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
		},
		revisions: revisions.map(revisionEntry),
		milestones: milestoneRows.map((milestone) =>
			milestoneEntry(
				milestone,
				evidenceRows.filter(
					(evidence) => evidence.milestoneId === milestone.id,
				),
			),
		),
		monthlyReports: reportRows.map(monthlyReportEntry),
		forecasts: forecastRows.map(forecastEntry),
	};
}

export async function listProcurementStatus(
	db: GreenShiftDb,
	userId: number,
	limit: number,
): Promise<VendorProcurementStatusItem[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listProcurementRows(db, vendorId, limit);

	return rows.map(({ proposal, tender, project, companyName, latestNote }) => ({
		proposalId: proposal.id,
		proposalStatus: proposal.status,
		revisionCount: proposal.revisionCount ?? 0,
		submittedAt: iso(proposal.submittedAt),
		reviewedAt: iso(proposal.reviewedAt),
		amount: proposal.amount,
		tenderId: tender.id,
		tenderStatus: tender.status,
		tenderDeadlineAt: iso(tender.deadlineAt),
		projectId: project.id,
		projectTitle: project.title,
		companyName,
		latestNote,
	}));
}
