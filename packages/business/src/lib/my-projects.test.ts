import { describe, expect, test } from "bun:test";
import {
	demoRiskForStatus,
	MY_PROJECTS,
	projectSummaryText,
} from "./my-projects";

describe("MY_PROJECTS", () => {
	test("has exactly 3 demo rows", () => {
		expect(MY_PROJECTS.length).toBe(3);
	});
	test("covers all three statuses once each", () => {
		const statuses = MY_PROJECTS.map((p) => p.status).sort();
		expect(statuses).toEqual(["Matchmaking", "Review LVV", "Verified"]);
	});
	test("required fields are non-empty", () => {
		for (const p of MY_PROJECTS) {
			expect(p.id.trim() === "" ? null : p.id).not.toBeNull();
			expect(p.name.trim() === "" ? null : p.name).not.toBeNull();
			expect(p.location.trim() === "" ? null : p.location).not.toBeNull();
			expect(p.sector.trim() === "" ? null : p.sector).not.toBeNull();
			expect(p.submittedAt.trim() === "" ? null : p.submittedAt).not.toBeNull();
		}
	});
	test("capex is null or non-negative", () => {
		for (const p of MY_PROJECTS) {
			const ok =
				p.capex === null || (typeof p.capex === "number" && p.capex >= 0);
			expect(ok ? true : null).not.toBeNull();
		}
	});
});
describe("demoRiskForStatus", () => {
	test("Review LVV demo is non-null Moderat with factors", () => {
		const r = demoRiskForStatus("Review LVV");
		expect(r.level).toBe("Moderat");
		expect(r.factors.length > 0 ? true : null).not.toBeNull();
	});
	test("Verified demo scores lower risk than Review LVV", () => {
		const v = demoRiskForStatus("Verified");
		const r = demoRiskForStatus("Review LVV");
		expect(v.score < r.score ? true : null).not.toBeNull();
		expect(v.level).toBe("Rendah");
	});
});

describe("projectSummaryText", () => {
	test("names the project and its status", () => {
		const t = projectSummaryText(MY_PROJECTS[0]);
		expect(
			t.includes("PLTS Atap Pabrik Cikarang") ? true : null,
		).not.toBeNull();
		expect(t.includes("Review LVV") ? true : null).not.toBeNull();
	});
	test("formats CAPEX as Indonesian rupiah", () => {
		const t = projectSummaryText(MY_PROJECTS[0]);
		expect(t.includes("Rp 4.200.000.000") ? true : null).not.toBeNull();
	});
});
