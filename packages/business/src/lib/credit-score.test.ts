import { describe, expect, test } from "bun:test";
import { creditScore, nextRatingBand, ratingForScore } from "./credit-score";

describe("creditScore", () => {
	test("empty inputs -> null score and rating", () => {
		expect(
			creditScore({
				capex: null,
				tenor: null,
				saving: null,
				docsDone: 0,
				docsTotal: 2,
			}),
		).toEqual({ score: null, rating: null });
	});
	test("zero tenor -> null (no divide by zero)", () => {
		expect(
			creditScore({
				capex: 1_000,
				tenor: 0,
				saving: 500,
				docsDone: 0,
				docsTotal: 2,
			}),
		).toEqual({ score: null, rating: null });
	});
	test("mid debt-service proxy lands in the BBB+ band", () => {
		// capex 1B / tenor 10 -> 100M annual debt; saving 60M -> 60 pts, docs 1/2 -> 50 pts; 60*0.7 + 50*0.3 = 57 -> BBB+.
		const r = creditScore({
			capex: 1_000_000_000,
			tenor: 10,
			saving: 60_000_000,
			docsDone: 1,
			docsTotal: 2,
		});
		expect(r.score).toBe(57);
		expect(r.rating).toBe("BBB+");
	});
	test("BBB+ band mapping covers 55-64", () => {
		expect(ratingForScore(55)).toBe("BBB+");
		expect(ratingForScore(64)).toBe("BBB+");
		expect(ratingForScore(65)).toBe("A");
		expect(ratingForScore(54)).toBe("BBB");
	});
	test("debt-service contribution caps at 100", () => {
		const capped = creditScore({
			capex: 1_000,
			tenor: 1,
			saving: 1_000_000,
			docsDone: 0,
			docsTotal: 0,
		});
		expect(capped.score).toBe(70);
	});
	test("doc completeness contributes to the score", () => {
		const none = creditScore({
			capex: 1_000_000_000,
			tenor: 10,
			saving: 50_000_000,
			docsDone: 0,
			docsTotal: 2,
		});
		const full = creditScore({
			capex: 1_000_000_000,
			tenor: 10,
			saving: 50_000_000,
			docsDone: 2,
			docsTotal: 2,
		});
		expect(full.score).not.toBeNull();
		expect(none.score).not.toBeNull();
		expect((full.score as number) - (none.score as number)).toBe(30);
	});
});

describe("rating bands", () => {
	// The panel reads the score as "N more to the next band", so the band boundary decides that sentence.
	test("a score one point under a band still points at it", () => {
		expect(nextRatingBand(84)).toEqual({ rating: "AAA", min: 85 });
		expect(ratingForScore(84)).toBe("AA");
		expect(nextRatingBand(84)?.min).toBe(84 + 1);
	});
	test("a score on the top band has no next band", () => {
		expect(nextRatingBand(85)).toBeNull();
		expect(nextRatingBand(100)).toBeNull();
		expect(ratingForScore(100)).toBe("AAA");
	});
	test("an empty score reads as the bottom band", () => {
		expect(ratingForScore(0)).toBe("B");
		expect(nextRatingBand(0)).toEqual({ rating: "BB", min: 35 });
	});
});
