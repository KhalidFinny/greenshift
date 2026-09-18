import type {
	BlueprintSummary,
	BondListing,
	BondStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { blueprints } from "../../../db/schema";
import {
	listFundedByProject,
	listProjectRows,
	listPublishedBlueprints,
} from "./market.repository";

type BlueprintRow = typeof blueprints.$inferSelect;

/**
 * Public bond catalog: every project that is at least in assessment, grouped
 * by whether its blueprint has been published (verified) or is still being
 * processed. Funding totals come from active investments only.
 */
export async function listBondListings(
	db: GreenShiftDb,
): Promise<BondListing[]> {
	const projectRows = await listProjectRows(db);

	// Latest published blueprint per project is the verification signal.
	const publishedBlueprints = await listPublishedBlueprints(db);

	const blueprintByProject = new Map<
		number,
		(typeof publishedBlueprints)[number]
	>();
	for (const row of publishedBlueprints) {
		if (!blueprintByProject.has(row.projectId)) {
			blueprintByProject.set(row.projectId, row);
		}
	}

	const fundedRows = await listFundedByProject(db);

	const fundedByProject = new Map(
		fundedRows.map((row) => [row.projectId, row.funded]),
	);

	const bonds: BondListing[] = projectRows.map(({ project, companyName }) => {
		const blueprint = blueprintByProject.get(project.id);
		const funded = fundedByProject.get(project.id) ?? 0;
		const budget = project.budget ?? 0;

		return {
			id: project.id,
			title: project.title,
			bondCode: null,
			companyName,
			industrySector: project.industrySector,
			location: project.location,
			budget: project.budget,
			riskScore: project.riskScore,
			targetEmissionReduction: project.targetEmissionReduction,
			estimatedEnergySaving: project.estimatedEnergySaving,
			funded,
			fundingProgress:
				budget > 0 ? Math.min(Math.max(funded / budget, 0), 1) : 0,
			status: (blueprint ? "verified" : "on_progress") satisfies BondStatus,
			verifiedAt: blueprint?.publishedAt?.toISOString() ?? null,
			blueprint: blueprint
				? blueprintSummary(blueprint.document)
				: emptyBlueprint(),
		};
	});

	return bonds;
}

function emptyBlueprint(): BlueprintSummary {
	return { irr: undefined, npv: undefined, paybackPeriod: undefined };
}

function blueprintSummary(
	document: BlueprintRow["document"],
): BlueprintSummary {
	return {
		irr: document?.financialProjections?.irr,
		npv: document?.financialProjections?.npv,
		paybackPeriod: document?.financialProjections?.paybackPeriod,
	};
}
