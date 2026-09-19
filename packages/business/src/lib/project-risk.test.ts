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
	test("all Rendah + strong credit -> low score, Rendah level", () => {
		const r = projectRisk({
			finansial: "Rendah",
			teknis: "Rendah",
			implementasi: "Rendah",
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(r).not.toBeNull();
		// (15 + 15 + 15 + 10) / 4 = 13.75 -> 14
		expect(r?.score).toBe(14);
		expect(r?.level).toBe("Rendah");
		expect(r?.factors).toEqual([]);
	});
	test("all Tinggi + weak credit -> high score, Tinggi level", () => {
		const r = projectRisk({
			finansial: "Tinggi",
			teknis: "Tinggi",
			implementasi: "Tinggi",
			creditScore: 10,
			docsDone: 0,
			docsTotal: 9,
		});
		expect(r).not.toBeNull();
		// (85 + 85 + 85 + 90) / 4 = 86.25 -> 86
		expect(r?.score).toBe(86);
		expect(r?.level).toBe("Tinggi");
		expect(r?.factors).toContain("Risiko Finansial tinggi");
		expect(r?.factors).toContain("Risiko Teknis tinggi");
		expect(r?.factors).toContain("Risiko Implementasi tinggi");
		expect(r?.factors).toContain("Risiko Pembiayaan tinggi");
		expect(r?.factors).toContain("Kelengkapan dokumen rendah");
	});
	test("level band boundaries", () => {
		expect(levelForRiskScore(0)).toBe("Rendah");
		expect(levelForRiskScore(39)).toBe("Rendah");
		expect(levelForRiskScore(40)).toBe("Moderat");
		expect(levelForRiskScore(69)).toBe("Moderat");
		expect(levelForRiskScore(70)).toBe("Tinggi");
		expect(levelForRiskScore(100)).toBe("Tinggi");
	});
	test("success = 100 - score", () => {
		const r = projectRisk({
			finansial: "Sedang",
			teknis: "Sedang",
			implementasi: "Sedang",
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
			finansial: "Rendah",
			teknis: "Sedang",
			implementasi: "Tinggi",
			creditScore: null,
			docsDone: 2,
			docsTotal: 4,
		});
		expect(r?.breakdown.map((b) => b.label)).toEqual([
			"Finansial",
			"Teknis",
			"Implementasi",
			"Pembiayaan",
		]);
		expect(r?.breakdown.map((b) => b.pct)).toEqual([15, 55, 85, 0]);
	});
	test("factors only name the worst areas", () => {
		const r = projectRisk({
			finansial: "Tinggi",
			teknis: "Rendah",
			implementasi: null,
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(r?.factors).toEqual(["Risiko Finansial tinggi"]);
	});
	test("doc factor appears below half, absent at half", () => {
		const low = projectRisk({
			finansial: "Rendah",
			teknis: "Rendah",
			implementasi: "Rendah",
			creditScore: 90,
			docsDone: 1,
			docsTotal: 4,
		});
		expect(low?.factors).toContain("Kelengkapan dokumen rendah");
		const half = projectRisk({
			finansial: "Rendah",
			teknis: "Rendah",
			implementasi: "Rendah",
			creditScore: 90,
			docsDone: 2,
			docsTotal: 4,
		});
		expect(half?.factors).toEqual([]);
	});
	test("mitigations are static guidance copy", () => {
		const r = projectRisk({
			finansial: "Sedang",
			teknis: "Sedang",
			implementasi: "Sedang",
			creditScore: 50,
			docsDone: 4,
			docsTotal: 9,
		});
		expect((r?.mitigations.length ?? 0) >= 3).toBe(true);
		for (const m of r?.mitigations ?? []) expect(m.length > 0).toBe(true);
	});
	test("summary names the level and the worst area", () => {
		const high = projectRisk({
			finansial: "Tinggi",
			teknis: "Tinggi",
			implementasi: "Tinggi",
			creditScore: 10,
			docsDone: 0,
			docsTotal: 9,
		});
		expect(high?.summary).toContain("Tinggi");
		expect(high?.summary).toContain("Pembiayaan");
		const low = projectRisk({
			finansial: "Tinggi",
			teknis: "Rendah",
			implementasi: "Rendah",
			creditScore: 90,
			docsDone: 9,
			docsTotal: 9,
		});
		expect(low?.summary).toContain("Rendah");
		expect(low?.summary).toContain("Finansial");
	});
	test("tone mapping Rendah->15 Sedang->55 Tinggi->85 null->0", () => {
		expect(toneToPct("Rendah")).toBe(15);
		expect(toneToPct("Sedang")).toBe(55);
		expect(toneToPct("Tinggi")).toBe(85);
		expect(toneToPct(null)).toBe(0);
	});
});
