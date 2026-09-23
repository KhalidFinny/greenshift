import type {
	BondListing,
	BondMonitoring,
	BondStatus,
	BondTerms,
	ProjectBlueprintView,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	listEmissionMonitoring,
	listIssuedBonds,
	listProjectRows,
	listPublishedBlueprints,
} from "./market.repository";

// Public bond catalog: projects at least in assessment, split by whether their
// blueprint is published. Reports emissions; money lives in the SCF partner's app.
export async function listBondListings(
	db: GreenShiftDb,
): Promise<BondListing[]> {
	const projectRows = await listProjectRows(db);

	// Latest published blueprint per project is the verification signal, and the
	// document behind it is what the detail preview reads.
	const publishedBlueprints = await listPublishedBlueprints(db);

	const publishedByProject = new Map<
		number,
		(typeof publishedBlueprints)[number]
	>();
	for (const row of publishedBlueprints) {
		if (!publishedByProject.has(row.projectId)) {
			publishedByProject.set(row.projectId, row);
		}
	}

	const monitoringRows = await listEmissionMonitoring(db);
	const monitoringByProject = new Map(
		monitoringRows.map((row) => [row.projectId, row]),
	);

	const issuedBonds = await listIssuedBonds(db);
	const issuedByProject = new Map(
		issuedBonds.map((row) => [row.projectId, row]),
	);

	return projectRows.map(({ project, companyName }) => {
		const published = publishedByProject.get(project.id);
		const monitoring = monitoringByProject.get(project.id);
		const issued = issuedByProject.get(project.id);
		const document = published?.document;
		const projections = document?.financialProjections;

		const blueprint: ProjectBlueprintView | null = published
			? {
					status: published.status,
					validatedAt: iso(published.validatedAt),
					discountRatePct: projections?.discountRatePct ?? null,
					horizonYears: projections?.horizonYears ?? null,
					irr: projections?.irr ?? undefined,
					npv: projections?.npv ?? undefined,
					paybackPeriod: projections?.paybackPeriod ?? undefined,
					fundingStructure: document?.fundingStructure ?? null,
					emissionTargets: document?.emissionTargets ?? null,
					scenarios: projections?.scenarios ?? [],
				}
			: null;

		const bondTerms: BondTerms | null = issued
			? {
					amount: issued.amount,
					tenorMonths: issued.tenorMonths,
					couponRatePercent: issued.couponRatePercent,
					issuanceDate: iso(issued.issuanceDate),
					maturityDate: iso(issued.maturityDate),
					status: issued.status,
				}
			: null;

		const periodStart = monitoring?.latestPeriod ?? null;
		const monitoringSummary: BondMonitoring = {
			verifiedTco2: monitoring?.verifiedTco2 ?? 0,
			periods: monitoring?.periods ?? 0,
			latestPeriod:
				periodStart === null
					? null
					: new Date(periodStart).toISOString().slice(0, 7),
			anomalyFlagged: (monitoring?.anomalyFlagged ?? 0) === 1,
		};

		return {
			id: project.id,
			title: project.title,
			// Only an issued bond carries a code investors can search for.
			bondCode: issued?.serial ?? null,
			companyName,
			industrySector: project.industrySector,
			location: project.location,
			riskScore: project.riskScore,
			targetEmissionReduction: project.targetEmissionReduction,
			estimatedEnergySaving: project.estimatedEnergySaving,
			status: (published ? "verified" : "on_progress") satisfies BondStatus,
			verifiedAt: published?.publishedAt?.toISOString() ?? null,
			monitoring: monitoringSummary,
			blueprint,
			bondTerms,
		};
	});
}
