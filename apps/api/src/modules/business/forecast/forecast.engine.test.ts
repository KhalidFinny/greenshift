import { describe, expect, test } from "bun:test";
import type { RoiForecast } from "../../../contracts";
import {
	DISCOUNT_RATE_PCT,
	MAX_HORIZON_YEARS,
	roiForecast,
} from "./forecast.engine";

/** A project whose saving repays its capital in a plausible number of years. */
const PROJECT = {
	capexRp: 2_400_000_000,
	tenorTahun: 6,
	penghematanRp: 600_000_000,
};

/** The forecast for a case that has one, failing loudly when it does not. */
function forecastOf(input: Parameters<typeof roiForecast>[0]): RoiForecast {
	const forecast = roiForecast(input);
	if (forecast === null)
		throw new Error("Expected a forecast for these figures");
	return forecast;
}

describe("roiForecast", () => {
	test("an incomplete funding case has no forecast", () => {
		expect(roiForecast({ ...PROJECT, capexRp: null })).toBeNull();
		expect(roiForecast({ ...PROJECT, penghematanRp: null })).toBeNull();
		expect(roiForecast({ ...PROJECT, tenorTahun: 0 })).toBeNull();
		// A project that saves nothing cannot repay anything.
		expect(roiForecast({ ...PROJECT, penghematanRp: 0 })).toBeNull();
	});

	test("the three scenarios run weakest to strongest", () => {
		const forecast = forecastOf(PROJECT);

		expect(forecast.scenarios.map((s) => s.key)).toEqual([
			"conservative",
			"base",
			"optimistic",
		]);

		const conservative = forecast.scenarios[0];
		const base = forecast.scenarios[1];
		const optimistic = forecast.scenarios[2];
		if (!conservative || !base || !optimistic) {
			throw new Error("Expected three scenarios");
		}

		expect(conservative.npvRp).toBeLessThan(base.npvRp);
		expect(base.npvRp).toBeLessThan(optimistic.npvRp);
		expect(conservative.paybackYears).toBeGreaterThan(
			optimistic.paybackYears ?? 0,
		);
	});

	test("the headline figures are the base case", () => {
		const forecast = forecastOf(PROJECT);
		const base = forecast.scenarios.find((s) => s.key === "base");

		expect(base).not.toBeNull();
		expect(forecast.npvRp).toBe(base?.npvRp);
		expect(forecast.irrPct).toBe(base?.irrPct);
		expect(forecast.paybackYears).toBe(base?.paybackYears);
		expect(forecast.discountRatePct).toBe(DISCOUNT_RATE_PCT);
	});

	test("IRR is the rate at which the saving repays the capital", () => {
		const forecast = forecastOf(PROJECT);
		const irr = forecast.irrPct;

		// 2.4bn repaid out of 600m a year, growing with energy-price inflation
		// and wearing with the asset: the answer sits in the low teens rather
		// than at the simple 25% the undiscounted payback would suggest.
		expect(irr).not.toBeNull();
		if (irr === null) throw new Error("Expected an IRR");
		expect(irr).toBeGreaterThan(5);
		expect(irr).toBeLessThan(30);
	});

	test("a project whose saving never covers its capital reports no IRR", () => {
		const forecast = forecastOf({
			capexRp: 10_000_000_000,
			tenorTahun: 3,
			penghematanRp: 100_000_000,
		});

		expect(forecast.irrPct).toBeNull();
		expect(forecast.npvRp).toBeLessThan(0);
	});

	test("a mistyped tenor is capped at the engine's horizon", () => {
		expect(forecastOf({ ...PROJECT, tenorTahun: 400 }).horizonYears).toBe(
			MAX_HORIZON_YEARS,
		);
	});

	test("the recovery series spends the capital first and ends at the present value", () => {
		const forecast = forecastOf(PROJECT);

		for (const scenario of forecast.scenarios) {
			const series = scenario.recoveryRp;

			// The capital at year zero, then one entry per year of the horizon.
			expect(series.length).toBe(forecast.horizonYears + 1);
			expect(series[0]).toBe(-forecast.capexRp);
			expect(series[series.length - 1]).toBe(scenario.npvRp);

			// The saving only ever comes back, so nothing in the series falls
			// below the year before it: a chart reads one line, not noise.
			const falling = series.filter(
				(value, year) => year > 0 && value < (series[year - 1] ?? 0),
			);
			expect(falling).toEqual([]);
		}
	});

	test("the recovery series crosses zero inside the tenor it repays within", () => {
		const forecast = forecastOf(PROJECT);
		const base = forecast.scenarios.find((s) => s.key === "base");
		if (!base) throw new Error("Expected a base case");

		// Zero is the year the capital is back in present-value terms, and it is
		// the year the chart marks.
		const repaid = base.recoveryRp.findIndex((value) => value >= 0);
		expect(repaid).toBeGreaterThan(0);
		expect(repaid <= forecast.horizonYears).toBe(true);
		expect(base.npvRp).toBeGreaterThan(0);

		// A case that never repays its capital never crosses.
		const lost = forecastOf({
			capexRp: 10_000_000_000,
			tenorTahun: 3,
			penghematanRp: 100_000_000,
		});
		const lostBase = lost.scenarios.find((s) => s.key === "base");
		if (!lostBase) throw new Error("Expected a base case");
		expect(lostBase.recoveryRp.every((value) => value < 0)).toBe(true);
	});
});
