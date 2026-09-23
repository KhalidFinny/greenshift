// The ROI engine shared by the wizard's review step and the blueprint, so both carry the same scenarios.

import type {
	ForecastScenario,
	ForecastScenarioKey,
	RoiForecast,
} from "../../../contracts";

// A stated platform assumption, not a per-project cost of capital: partners compare projects.
export const DISCOUNT_RATE_PCT = 12;

/** A tenor beyond this is a typo, and the cash flows stop there. */
export const MAX_HORIZON_YEARS = 30;

interface ScenarioSpec {
	key: ForecastScenarioKey;
	label: string;
	/** Share of the planned annual saving the scenario assumes, in percent. */
	savingPct: number;
	inflationPct: number;
	degradationPct: number;
}

// Conservative / Base Case / Optimistic, in the order the screen shows them.
const SCENARIO_SPECS: readonly ScenarioSpec[] = [
	{
		key: "conservative",
		label: "Conservative",
		savingPct: 85,
		inflationPct: 2,
		degradationPct: 1.5,
	},
	{
		key: "base",
		label: "Base Case",
		savingPct: 100,
		inflationPct: 3,
		degradationPct: 1,
	},
	{
		key: "optimistic",
		label: "Optimistic",
		savingPct: 110,
		inflationPct: 4,
		degradationPct: 0.5,
	},
];

/** The Step 2 figures a forecast is computed from. */
export interface ForecastInput {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
}

// Floored at a year so a project cannot be modelled over no time, capped against a mistyped tenor.
function horizonFor(tenorTahun: number | null): number | null {
	if (tenorTahun === null || !Number.isFinite(tenorTahun) || tenorTahun <= 0) {
		return null;
	}
	return Math.min(Math.max(Math.round(tenorTahun), 1), MAX_HORIZON_YEARS);
}

// First year is the planned saving at the scenario's share; each year after grows with the price and shrinks with wear.
function cashFlows(
	spec: ScenarioSpec,
	annualSavingRp: number,
	horizonYears: number,
): number[] {
	const firstYear = annualSavingRp * (spec.savingPct / 100);
	const growth =
		(1 + spec.inflationPct / 100) * (1 - spec.degradationPct / 100);

	const flows: number[] = [];
	let flow = firstYear;
	for (let year = 1; year <= horizonYears; year += 1) {
		if (year > 1) flow *= growth;
		flows.push(flow);
	}
	return flows;
}

function npvAt(rate: number, capexRp: number, flows: number[]): number {
	return (
		flows.reduce(
			(total, flow, index) => total + flow / (1 + rate) ** (index + 1),
			0,
		) - capexRp
	);
}

// Positive flows against up-front capital make present value fall monotonically, so bisection finds the root.
function irrPct(capexRp: number, flows: number[]): number | null {
	if (capexRp <= 0 || flows.length === 0) return null;

	const total = flows.reduce((sum, flow) => sum + flow, 0);
	if (total <= capexRp) return null;

	let low = -0.9;
	let high = 10;
	// 60 halvings is far below the rounding the answer is reported at.
	for (let step = 0; step < 60; step += 1) {
		const mid = (low + high) / 2;
		if (npvAt(mid, capexRp, flows) > 0) {
			low = mid;
		} else {
			high = mid;
		}
	}

	return Math.round(((low + high) / 2) * 1000) / 10;
}

// The capital account as one series: out at year zero, then each year's discounted inflow.
function recovery(capexRp: number, flows: number[]): number[] {
	const series = [-Math.round(capexRp)];
	let recovered = -capexRp;
	flows.forEach((flow, index) => {
		recovered += flow / (1 + DISCOUNT_RATE_PCT / 100) ** (index + 1);
		series.push(Math.round(recovered));
	});
	return series;
}

function scenario(
	spec: ScenarioSpec,
	capexRp: number,
	annualSavingRp: number,
	horizonYears: number,
): ForecastScenario {
	const flows = cashFlows(spec, annualSavingRp, horizonYears);
	const firstYear = flows[0] ?? 0;
	const recoveryRp = recovery(capexRp, flows);

	return {
		key: spec.key,
		label: spec.label,
		savingPct: spec.savingPct,
		inflationPct: spec.inflationPct,
		degradationPct: spec.degradationPct,
		firstYearSavingRp: Math.round(firstYear),
		// The end of the recovery series is the present value of the whole case.
		npvRp: recoveryRp[recoveryRp.length - 1] ?? 0,
		irrPct: irrPct(capexRp, flows),
		paybackYears:
			firstYear > 0 ? Math.round((capexRp / firstYear) * 10) / 10 : null,
		recoveryRp,
	};
}

// Null when the figures cannot state a funding case: capital, tenor and saving are all required.
export function roiForecast(input: ForecastInput): RoiForecast | null {
	const { capexRp, penghematanRp } = input;
	const horizonYears = horizonFor(input.tenorTahun);

	if (
		capexRp === null ||
		!Number.isFinite(capexRp) ||
		capexRp <= 0 ||
		penghematanRp === null ||
		!Number.isFinite(penghematanRp) ||
		penghematanRp <= 0 ||
		horizonYears === null
	) {
		return null;
	}

	const scenarios = SCENARIO_SPECS.map((spec) =>
		scenario(spec, capexRp, penghematanRp, horizonYears),
	);
	const base = scenarios.find((entry) => entry.key === "base");

	return {
		capexRp: Math.round(capexRp),
		discountRatePct: DISCOUNT_RATE_PCT,
		horizonYears,
		npvRp: base?.npvRp ?? 0,
		irrPct: base?.irrPct ?? null,
		paybackYears: base?.paybackYears ?? null,
		scenarios,
	};
}
