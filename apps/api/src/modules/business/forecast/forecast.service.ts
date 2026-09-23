/* The project's funding case, in one place.
 *
 * Two readers need it: the wizard's review step, which asks for the forecast
 * before the project exists, and the verification flow, which writes the
 * forecast into the Green Project Blueprint the moment LVV GRK clears the
 * project. Both go through `roiForecast`, so the scenarios a company was shown
 * are the scenarios the blueprint carries.
 */

import type {
	BlueprintDocument,
	ProjectBlueprintView,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { projects } from "../../../db/schema";
import { iso } from "../../../lib/format";
import { roiForecast } from "./forecast.engine";
import * as repository from "./forecast.repository";

type ProjectRow = typeof projects.$inferSelect;

/**
 * The stored project figures a blueprint document is built from.
 *
 * Narrower than the row on purpose: the verification flow hands it a project
 * row, and the fixture seed hands it the figures it just wrote, so both go
 * through the one builder and the seeded documents are the documents
 * verification would have written.
 */
export interface BlueprintInput {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
	konsumsiMwh: number | null;
	faktorEmisi: number | null;
	targetPct: number | null;
	targetMwh: number | null;
}

/**
 * The blueprint document for one project: what it costs and how it is funded,
 * what it promises to cut, and the three scenarios that say whether the
 * saving carries it.
 *
 * Null when the project cannot state a funding case or an emission target:
 * both sections are what the document is for, so a partial one is not written.
 */
export function buildBlueprintDocument(
	row: BlueprintInput,
): BlueprintDocument | null {
	const forecast = roiForecast({
		capexRp: row.capexRp,
		tenorTahun: row.tenorTahun,
		penghematanRp: row.penghematanRp,
	});
	const { capexRp, tenorTahun, penghematanRp, konsumsiMwh, faktorEmisi } = row;
	const baselineTco2 =
		konsumsiMwh !== null && faktorEmisi !== null
			? konsumsiMwh * faktorEmisi
			: null;

	if (
		forecast === null ||
		capexRp === null ||
		tenorTahun === null ||
		penghematanRp === null ||
		baselineTco2 === null ||
		row.targetPct === null
	) {
		return null;
	}

	return {
		fundingStructure: {
			instrument: "green_bond",
			capexRp,
			tenorYears: tenorTahun,
			annualSavingRp: penghematanRp,
			annualRevenueRp: row.pendapatanRp,
			collateral: row.jaminan,
		},
		emissionTargets: {
			baselineTco2,
			targetPct: row.targetPct,
			targetTco2: (baselineTco2 * row.targetPct) / 100,
			energySavingKwh: (row.targetMwh ?? 0) * 1000,
		},
		financialProjections: {
			npv: forecast.npvRp,
			irr: forecast.irrPct,
			paybackPeriod: forecast.paybackYears,
			discountRatePct: forecast.discountRatePct,
			horizonYears: forecast.horizonYears,
			scenarios: forecast.scenarios,
		},
	};
}

/**
 * Generates the project's blueprint now that verification has cleared it, and
 * answers with its id, or null when the project has no funding case to write.
 *
 * A project that already carries a blueprint keeps the one it has: a repeated
 * verification pass must not stack a second document on the same project.
 */
export async function generateBlueprint(
	db: GreenShiftDb,
	row: ProjectRow,
): Promise<number | null> {
	const existing = await repository.findBlueprintIdForProject(db, row.id);
	if (existing !== null) return existing;

	const document = buildBlueprintDocument(row);
	if (document === null) return null;

	const { id } = await repository.insertValidatedBlueprint(db, {
		projectId: row.id,
		document,
		actorId: null,
		note: "Generated at LVV GRK verification from the submitted project figures.",
	});
	return id;
}

/**
 * The project's own Green Project Blueprint, or null while it has none.
 *
 * The document is stored as it was written, so its sections are optional and
 * the projections are lifted out of them here: the page that shows the document
 * reads the same `ProjectBlueprintView` a bidder reads, without walking the
 * JSON column itself.
 */
export async function readProjectBlueprint(
	db: GreenShiftDb,
	projectId: number,
): Promise<ProjectBlueprintView | null> {
	const row = await repository.findBlueprintForProject(db, projectId);
	if (row === null) return null;

	const document = row.document ?? {};
	const projections = document.financialProjections;

	return {
		status: row.status,
		validatedAt: iso(row.validatedAt),
		discountRatePct: projections?.discountRatePct ?? null,
		horizonYears: projections?.horizonYears ?? null,
		irr: projections?.irr ?? undefined,
		npv: projections?.npv ?? undefined,
		paybackPeriod: projections?.paybackPeriod ?? undefined,
		fundingStructure: document.fundingStructure ?? null,
		emissionTargets: document.emissionTargets ?? null,
		scenarios: projections?.scenarios ?? [],
	};
}
