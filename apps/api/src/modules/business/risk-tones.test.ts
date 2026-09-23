import { describe, expect, test } from "bun:test";
import {
	finansialTone,
	implementasiTone,
	pembiayaanTone,
	teknisTone,
} from "./business.scoring";

// The thresholds mirror the frontend wizard's, so a divergence between the two fails here.

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
