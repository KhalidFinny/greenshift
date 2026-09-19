import type {
	VendorProjectDetail,
	VendorProjectListItem,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { tenderSummary, vendorProfileId } from "../vendor.shared";
import * as repository from "./projects.repository";

// ── projects (procurement market) ─────────────────────────
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

	// Blueprint financials and the risk composite are confidential until
	// published to the market (investors only see them post-publication).
	const published = row.blueprint?.status === "published";
	const bp = published ? row.blueprint : null;

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
		riskScore: published ? row.project.riskScore : null,
		tender: row.tender ? tenderSummary(row.tender) : null,
		blueprint: {
			irr: bp?.document?.financialProjections?.irr,
			npv: bp?.document?.financialProjections?.npv,
			paybackPeriod: bp?.document?.financialProjections?.paybackPeriod,
		},
		canSubmit,
	};
}
