import { describe, expect, test } from "bun:test";
import { levelForRiskScore, projectRisk, toneToPct } from "./project-risk";

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
