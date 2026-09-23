import type {
	BondListing,
	BondMonitoring,
	BondStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	listEmissionMonitoring,
	listIssuedBondCodes,
	listProjectRows,
	listPublishedBlueprints,
} from "./market.repository";

/**
 * Public bond catalog: every project that is at least in assessment, grouped
 * by whether its blueprint has been published (verified) or is still being
 * processed.
 *
 * The listing reports emissions rather than money. Issuance, placement and
 * settlement happen in the SCF partner's app, so what GreenShift can stand
 * behind here is what its own MRV periods measured, and the code an investor
 * searches for in that partner's app.
 */
export async function listBondListings(
	db: GreenShiftDb,
): Promise<BondListing[]> {
	const projectRows = await listProjectRows(db);

	// Latest published blueprint per project is the verification signal.
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

	const issuedCodes = await listIssuedBondCodes(db);
	const codeByProject = new Map(
		issuedCodes
			.filter((row) => row.serial !== null)
			.map((row) => [row.projectId, row.serial as string]),
	);

	return projectRows.map(({ project, companyName }) => {
		const published = publishedByProject.get(project.id);
		const monitoring = monitoringByProject.get(project.id);

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
			bondCode: codeByProject.get(project.id) ?? null,
			companyName,
			industrySector: project.industrySector,
			location: project.location,
			riskScore: project.riskScore,
			targetEmissionReduction: project.targetEmissionReduction,
			estimatedEnergySaving: project.estimatedEnergySaving,
			status: (published ? "verified" : "on_progress") satisfies BondStatus,
			verifiedAt: published?.publishedAt?.toISOString() ?? null,
			monitoring: monitoringSummary,
		};
	});
}
