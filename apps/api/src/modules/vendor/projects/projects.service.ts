import type {
	VendorProjectDetail,
	VendorProjectListItem,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	isTenderVisibleTo,
	tenderSummary,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./projects.repository";

export async function listMarketProjects(
	db: GreenShiftDb,
	userId: number,
	tenderStatus: string | undefined,
	limit: number,
): Promise<VendorProjectListItem[]> {
	const vendorId = await vendorProfileId(db, userId);
	const rows = await repository.listProjectTenders(
		db,
		vendorId ?? -1,
		tenderStatus,
		limit,
	);

	return rows.map(
		({ project, companyName, tender, myProposalId, matchScore }) => ({
			id: project.id,
			title: project.title,
			description: project.description,
			companyName,
			industrySector: project.industrySector,
			location: project.location,
			budget: project.budget,
			status: project.status,
			riskScore: project.riskScore,
			carbonReductionTargetTons: project.targetEmissionReduction,
			technicalRequirements: project.technicalRequirements ?? [],
			deliverables: project.deliverables ?? [],
			tender: tenderSummary(tender),
			myProposalId,
			matchScore: matchScore
				? {
						technicalFit: matchScore.technicalFit ?? 0,
						relevantExperience: matchScore.relevantExperience ?? 0,
						historicalPerformance: matchScore.historicalPerformance ?? 0,
						priceValue: matchScore.priceValue ?? 0,
						projectRisk: matchScore.projectRisk ?? 0,
						totalScore: matchScore.totalScore ?? 0,
						rank: matchScore.rank ?? 0,
					}
				: null,
		}),
	);
}

export async function getMarketProject(
	db: GreenShiftDb,
	userId: number,
	id: number,
): Promise<VendorProjectDetail | null> {
	const row = await repository.findProjectRow(db, id);
	if (!row) return null;

	const vendorId = await vendorProfileId(db, userId);

	// A private tender is not this vendor's to read unless it was opened for it.
	if (
		row.tender &&
		row.tender.method !== "open" &&
		!(
			vendorId !== null &&
			(await isTenderVisibleTo(db, row.project.id, vendorId, row.tender.method))
		)
	) {
		return null;
	}

	let canSubmit = false;
	if (vendorId !== null && row.tender) {
		const existing = await repository.findProposalIdForTender(
			db,
			row.tender.id,
			vendorId,
		);
		canSubmit =
			row.tender.status === "open" &&
			(!row.tender.deadlineAt ||
				row.tender.deadlineAt.getTime() > Date.now()) &&
			!existing;
	}

	// The blueprint is written at LVV verification, before the tender opens, so a
	// bidder reads the funding case it was cleared on; it stays hidden until validated.
	const blueprint =
		row.blueprint &&
		(row.blueprint.status === "validated" ||
			row.blueprint.status === "published")
			? row.blueprint
			: null;
	const projections = blueprint?.document?.financialProjections;

	return {
		id: row.project.id,
		title: row.project.title,
		description: row.project.description,
		companyName: row.companyName,
		industrySector: row.project.industrySector,
		location: row.project.location,
		budget: row.project.budget,
		status: row.project.status,
		targetEmissionReduction: row.project.targetEmissionReduction,
		estimatedEnergySaving: row.project.estimatedEnergySaving,
		riskScore: blueprint ? row.project.riskScore : null,
		tender: row.tender ? tenderSummary(row.tender) : null,
		blueprint: blueprint
			? {
					status: blueprint.status,
					validatedAt: iso(blueprint.validatedAt),
					discountRatePct: projections?.discountRatePct ?? null,
					horizonYears: projections?.horizonYears ?? null,
					irr: projections?.irr ?? undefined,
					npv: projections?.npv ?? undefined,
					paybackPeriod: projections?.paybackPeriod ?? undefined,
					fundingStructure: blueprint.document?.fundingStructure ?? null,
					emissionTargets: blueprint.document?.emissionTargets ?? null,
					scenarios: projections?.scenarios ?? [],
				}
			: null,
		canSubmit,
	};
}
