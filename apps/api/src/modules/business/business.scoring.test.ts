import { describe, expect, test } from "bun:test";
import {
	creditScore,
	finansialTone,
	implementasiTone,
	levelForRiskScore,
	pembiayaanTone,
	projectRisk,
	ratingForScore,
	teknisTone,
	toneToPct,
} from "./business.scoring";

// The credit and risk vectors below are the ones the frontend suite asserts
// against, so a change that makes the two implementations disagree fails here.

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
		// capex 1B / tenor 10 -> annual debt 100M; saving 60M -> 60 pts;
		// docs 1/2 -> 50 pts. 60*0.7 + 50*0.3 = 57 -> BBB+.
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

describe("projectRisk", () => {
	test("null when every input is empty", () => {
		expect(
			projectRisk({
				finansial: null,
				teknis: null,
				implementasi: null,
				creditScore: null,
				docsDone: 0,
				docsTotal: 0,
			}),
		).toBeNull();
	});
	test("single signal present -> computed, not null", () => {
		const r = projectRisk({
			finansial: null,
			teknis: null,
			implementasi: null,
			creditScore: 80,
			docsDone: 0,
			docsTotal: 0,
		});
		expect(r).not.toBeNull();
	});
	test("all Low + strong credit -> low score, Low level", () => {
		const r = projectRisk({
			finansial: "Low",
			teknis: "Low",
			implementasi: "Low",
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(r).not.toBeNull();
		// (15 + 15 + 15 + 10) / 4 = 13.75 -> 14
		expect(r?.score).toBe(14);
		expect(r?.level).toBe("Low");
		expect(r?.factors).toEqual([]);
	});
	test("all High + weak credit -> high score, High level", () => {
		const r = projectRisk({
			finansial: "High",
			teknis: "High",
			implementasi: "High",
			creditScore: 10,
			docsDone: 0,
			docsTotal: 9,
		});
		expect(r).not.toBeNull();
		// (85 + 85 + 85 + 90) / 4 = 86.25 -> 86
		expect(r?.score).toBe(86);
		expect(r?.level).toBe("High");
		const named = r?.factors.join(" ") ?? "";
		for (const area of [
			"Financial",
			"Technical",
			"Implementation",
			"Financing",
		])
			expect(named).toContain(area);
		expect(named).toContain("completeness");
	});
	test("level band boundaries", () => {
		expect(levelForRiskScore(0)).toBe("Low");
		expect(levelForRiskScore(39)).toBe("Low");
		expect(levelForRiskScore(40)).toBe("Medium");
		expect(levelForRiskScore(69)).toBe("Medium");
		expect(levelForRiskScore(70)).toBe("High");
		expect(levelForRiskScore(100)).toBe("High");
	});
	test("success = 100 - score", () => {
		const r = projectRisk({
			finansial: "Medium",
			teknis: "Medium",
			implementasi: "Medium",
			creditScore: 50,
			docsDone: 4,
			docsTotal: 9,
		});
		expect(r).not.toBeNull();
		// (55 + 55 + 55 + 50) / 4 = 53.75 -> 54
		expect(r?.score).toBe(54);
		expect(r?.success).toBe(46);
	});
	test("breakdown always has 4 labeled rows mirroring tones", () => {
		const r = projectRisk({
			finansial: "Low",
			teknis: "Medium",
			implementasi: "High",
			creditScore: null,
			docsDone: 2,
			docsTotal: 4,
		});
		expect(r?.breakdown.map((b) => b.label)).toEqual([
			"Financial",
			"Technical",
			"Implementation",
			"Financing",
		]);
		expect(r?.breakdown.map((b) => b.pct)).toEqual([15, 55, 85, 0]);
	});
	test("factors only name the worst areas", () => {
		const r = projectRisk({
			finansial: "High",
			teknis: "Low",
			implementasi: null,
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(r?.factors).toHaveLength(1);
		expect(r?.factors[0]).toContain("Financial");
	});
	test("doc factor appears below half, absent at half", () => {
		const low = projectRisk({
			finansial: "Low",
			teknis: "Low",
			implementasi: "Low",
			creditScore: 90,
			docsDone: 1,
			docsTotal: 4,
		});
		expect(low?.factors.some((f) => f.includes("completeness"))).toBe(true);
		const half = projectRisk({
			finansial: "Low",
			teknis: "Low",
			implementasi: "Low",
			creditScore: 90,
			docsDone: 2,
			docsTotal: 4,
		});
		expect(half?.factors).toEqual([]);
	});
	test("mitigations are static guidance copy", () => {
		const r = projectRisk({
			finansial: "Medium",
			teknis: "Medium",
			implementasi: "Medium",
			creditScore: 50,
			docsDone: 4,
			docsTotal: 9,
		});
		expect((r?.mitigations.length ?? 0) >= 3).toBe(true);
		for (const m of r?.mitigations ?? []) expect(m.length > 0).toBe(true);
	});
	test("summary names the level and the worst area", () => {
		const high = projectRisk({
			finansial: "High",
			teknis: "High",
			implementasi: "High",
			creditScore: 10,
			docsDone: 0,
			docsTotal: 9,
		});
		expect(high?.summary).toContain("High");
		expect(high?.summary).toContain("Financing");
		const low = projectRisk({
			finansial: "High",
			teknis: "Low",
			implementasi: "Low",
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(low?.summary).toContain("Low");
		expect(low?.summary).toContain("Financial");
	});
	test("tone mapping Low->15 Medium->55 High->85 null->0", () => {
		expect(toneToPct("Low")).toBe(15);
		expect(toneToPct("Medium")).toBe(55);
		expect(toneToPct("High")).toBe(85);
		expect(toneToPct(null)).toBe(0);
	});
});

describe("pembiayaanTone", () => {
	test("is the inverse of the credit score", () => {
		expect(pembiayaanTone(null)).toBeNull();
		expect(pembiayaanTone(90)).toBe("Low");
		expect(pembiayaanTone(55)).toBe("Low");
		expect(pembiayaanTone(54)).toBe("Medium");
		expect(pembiayaanTone(35)).toBe("Medium");
		expect(pembiayaanTone(34)).toBe("High");
	});
});

describe("wizard tone thresholds", () => {
	test("finansial: >5M Tinggi, >1M Sedang, else Rendah, null unknown", () => {
		expect(finansialTone(null)).toBeNull();
		expect(finansialTone(5_000_001)).toBe("High");
		expect(finansialTone(5_000_000)).toBe("Medium");
		expect(finansialTone(1_000_001)).toBe("Medium");
		expect(finansialTone(1_000_000)).toBe("Low");
	});
	test("teknis: >10k Tinggi, >2k Sedang, else Rendah, null unknown", () => {
		expect(teknisTone(null)).toBeNull();
		expect(teknisTone(10_001)).toBe("High");
		expect(teknisTone(10_000)).toBe("Medium");
		expect(teknisTone(2_001)).toBe("Medium");
		expect(teknisTone(2_000)).toBe("Low");
	});
	test("implementasi: nearer quarters carry more risk", () => {
		const now = new Date("2026-09-19T00:00:00Z");
		expect(implementasiTone(null, now)).toBeNull();
		expect(implementasiTone("bukan kuartal", now)).toBeNull();
		expect(implementasiTone("Q1 2027", now)).toBe("High");
		expect(implementasiTone("Q4 2028", now)).toBe("Medium");
		expect(implementasiTone("Q1 2031", now)).toBe("Low");
	});
	test("a quarter written in another case still parses", () => {
		const now = new Date("2026-09-19T00:00:00Z");
		expect(implementasiTone("q1 2027", now)).toBe("High");
	});
});
