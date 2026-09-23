// The project's funding case: the review step and the verification flow both go through `roiForecast`.

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

// Narrower than the project row on purpose: the fixture seed passes its figures, so seeded documents match verification's.
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

// Null unless the project can state both a funding case and an emission target.
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

// An existing blueprint is kept, never stacked on; null when there is no funding case.
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

// The stored sections are optional, so the projections are lifted out here for the page to read.
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
