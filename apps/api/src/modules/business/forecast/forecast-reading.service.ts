/* Eleanor's reading of the ROI forecast: what the computed scenarios mean for the
 * company, written from the forecast itself so every sentence traces to a figure. */

import type {
	BusinessRiskInsight,
	ForecastScenario,
	RoiForecast,
} from "../../../contracts";
import type { Env } from "../../../env";
import { ANALYST_VOICE, analystReading, joinWords } from "../review/analyst";

const SYSTEM_PROMPT = [
	ANALYST_VOICE,
	"",
	"Write two short paragraphs about this project's ROI forecast for the",
	"company's own review before it submits. The three cases are the same saving",
	"under a weaker, a planned and a stronger assumption, discounted at the stated",
	"rate over the funding's tenor. Say what the three mean for the decision:",
	"which of them repay the capital in present value and which do not, what the",
	"project's return is against the rate it is discounted at, and how long the",
	"capital takes to come back against the tenor. Do not repeat the figures back",
	"at the reader: say what they mean.",
].join("\n");

/** Rupiah with Indonesian grouping, the way the screens show it. */
function rupiah(value: number): string {
	return `Rp ${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

function percent(value: number): string {
	return `${Math.round(value)} per cent`;
}

function partitionByRecovery(forecast: RoiForecast): {
	recovered: ForecastScenario[];
	short: ForecastScenario[];
} {
	return {
		recovered: forecast.scenarios.filter((scenario) => scenario.npvRp >= 0),
		short: forecast.scenarios.filter((scenario) => scenario.npvRp < 0),
	};
}

function stated(scenario: ForecastScenario): string {
	const projectReturn =
		scenario.irrPct === null
			? "a return that never repays the capital at any rate"
			: `a return of ${percent(scenario.irrPct)}`;
	const payback =
		scenario.paybackYears === null
			? "no payback at this saving"
			: `the capital back in ${scenario.paybackYears.toFixed(1)} years at the first-year saving`;
	const presentValue =
		scenario.npvRp < 0
			? `${rupiah(-scenario.npvRp)} short of the capital in present value`
			: `${rupiah(scenario.npvRp)} in present value`;

	return `${scenario.label} assumes ${percent(scenario.savingPct)} of the plan, ${rupiah(scenario.firstYearSavingRp)} in the first year, with the saving growing at ${percent(scenario.inflationPct)} a year against ${percent(scenario.degradationPct)} of wear: ${presentValue}, ${projectReturn}, and ${payback}.`;
}

// The reading composed from the forecast alone, in the analyst's voice. Every
// sentence traces to a computed figure, so it is safe to show when the model is down.
export function composeForecastReading(forecast: RoiForecast): string {
	const { capexRp, discountRatePct, horizonYears, scenarios } = forecast;
	const { recovered, short } = partitionByRecovery(forecast);

	const first: string[] = [
		`The three cases put ${rupiah(capexRp)} of capital against the same annual saving over ${horizonYears} years, discounted at ${percent(discountRatePct)}.`,
	];
	if (recovered.length === scenarios.length) {
		first.push(
			`All three recover the capital in present value, so the funding case holds even where the saving under-delivers.`,
		);
	} else if (recovered.length === 0) {
		first.push(
			`None of the three recovers the capital in present value at that rate, so the case turns on the saving being larger or the capital smaller.`,
		);
	} else {
		first.push(
			`${joinWords(recovered.map((scenario) => scenario.label))} recover the capital in present value; ${joinWords(short.map((scenario) => scenario.label))} ${short.length === 1 ? "does" : "do"} not.`,
		);
	}

	const second: string[] = scenarios.map(stated);
	const base = scenarios.find((scenario) => scenario.key === "base");
	if (base) {
		second.push(
			`The base case is what the Green Project Blueprint carries as the project's projected return and net present value; the other two bound it.`,
		);
	}

	return `${first.join(" ")}\n\n${second.join(" ")}`;
}

/** The figures the reading is about: any of them changing changes the reading. */
function forecastReadingSignature(forecast: RoiForecast): string {
	const scenarios = forecast.scenarios.map((scenario) =>
		[
			scenario.key,
			scenario.savingPct,
			scenario.inflationPct,
			scenario.degradationPct,
			scenario.firstYearSavingRp,
			scenario.npvRp,
			scenario.irrPct,
			scenario.paybackYears,
		].join(":"),
	);
	return [
		forecast.capexRp,
		forecast.discountRatePct,
		forecast.horizonYears,
		...scenarios,
	].join("|");
}

// The forecast as a brief, derived values included, so the model reasons about the
// case instead of recomputing it and cannot mistake a share for an input.
function asBrief(forecast: RoiForecast): string {
	const lines = [
		`Capital: ${rupiah(forecast.capexRp)}.`,
		`Horizon: ${forecast.horizonYears} years.`,
		`Discount rate: ${percent(forecast.discountRatePct)}, stated by the platform rather than derived from the project.`,
	];
	for (const scenario of forecast.scenarios) {
		lines.push(
			[
				`${scenario.label}: ${percent(scenario.savingPct)} of the planned saving, ${rupiah(scenario.firstYearSavingRp)} in the first year, energy price +${percent(scenario.inflationPct)}/yr, asset wear -${percent(scenario.degradationPct)}/yr.`,
				`Net present value ${rupiah(scenario.npvRp)}; project return ${
					scenario.irrPct === null
						? "never repays the capital at any rate"
						: percent(scenario.irrPct)
				}; payback ${scenario.paybackYears === null ? "not reached" : `${scenario.paybackYears.toFixed(1)} years`}.`,
			].join(" "),
		);
	}
	const { recovered } = partitionByRecovery(forecast);
	lines.push(
		`Already worked out: ${recovered.length} of the ${forecast.scenarios.length} cases recover the capital in present value.`,
	);
	return lines.join("\n");
}

export async function forecastReading(
	env: Env,
	forecast: RoiForecast,
): Promise<BusinessRiskInsight> {
	return analystReading(env, {
		key: `forecast:${forecastReadingSignature(forecast)}`,
		system: SYSTEM_PROMPT,
		user: asBrief(forecast),
		fallback: composeForecastReading(forecast),
	});
}
