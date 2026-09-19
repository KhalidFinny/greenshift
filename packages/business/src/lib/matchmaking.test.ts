import { describe, expect, test } from "bun:test";
import {
	MATCH_FACTORS,
	MATCHMAKING_PROJECTS,
	PROCUREMENT_METHODS,
	RECOMMENDED_VENDORS,
} from "./matchmaking";

describe("MATCHMAKING_PROJECTS", () => {
	test("has exactly 3 rows", () => {
		expect(MATCHMAKING_PROJECTS.length).toBe(3);
	});
	test("has mixed vendor states", () => {
		const filled = MATCHMAKING_PROJECTS.filter(
			(p) => p.selectedVendor !== null,
		);
		const empty = MATCHMAKING_PROJECTS.filter((p) => p.selectedVendor === null);
		expect(filled.length > 0 ? true : null).not.toBeNull();
		expect(empty.length > 0 ? true : null).not.toBeNull();
	});
	test("filled vendor names are non-empty", () => {
		for (const p of MATCHMAKING_PROJECTS) {
			if (p.selectedVendor !== null) {
				expect(
					p.selectedVendor.trim() === "" ? null : p.selectedVendor,
				).not.toBeNull();
			}
		}
	});
	test("reuses project ids mp-1..mp-3", () => {
		expect(MATCHMAKING_PROJECTS.map((p) => p.id).sort()).toEqual([
			"mp-1",
			"mp-2",
			"mp-3",
		]);
	});
	test("mp-3 carries PT Solar Energi Nusantara", () => {
		const row = MATCHMAKING_PROJECTS.find((p) => p.id === "mp-3");
		expect(row?.selectedVendor).toBe("PT Solar Energi Nusantara");
	});
});

describe("RECOMMENDED_VENDORS", () => {
	test("has 3 rows with non-empty names", () => {
		expect(RECOMMENDED_VENDORS.length).toBe(3);
		for (const v of RECOMMENDED_VENDORS) {
			expect(v.name.trim() === "" ? null : v.name).not.toBeNull();
		}
	});
	test("scores are within 0-100", () => {
		for (const v of RECOMMENDED_VENDORS) {
			expect(v.score >= 0 && v.score <= 100 ? true : null).not.toBeNull();
		}
	});
});

describe("MATCH_FACTORS", () => {
	test("has 4 rows with pcts 0-100", () => {
		expect(MATCH_FACTORS.length).toBe(4);
		for (const f of MATCH_FACTORS) {
			expect(f.pct >= 0 && f.pct <= 100 ? true : null).not.toBeNull();
		}
	});
});

describe("PROCUREMENT_METHODS", () => {
	test("covers all three method ids", () => {
		expect(PROCUREMENT_METHODS.map((m) => m.id).sort()).toEqual([
			"CLOSED_BIDDING",
			"DIRECT_SELECTION",
			"OPEN_BIDDING",
		]);
	});
});
