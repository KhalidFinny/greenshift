import { describe, expect, test } from "bun:test";
import type { BusinessStep1, BusinessStep2 } from "../../contracts";
import {
	JAMINAN_OPTIONS,
	step1Errors,
	step2Errors,
	validationSummary,
} from "./business.validation";

// A complete, valid pair of blocks. Each test breaks exactly one field, so a
// failure names the rule it broke.
const STEP1: BusinessStep1 = {
	namaProyek: "PLTS Atap Pabrik Cikarang",
	lokasi: "Cikarang Pusat, Kabupaten Bekasi, Jawa Barat",
	sektor: "Manufaktur",
	konsumsiMwh: 12500.5,
	biayaRp: 4_200_000_000,
	faktorEmisi: 0.85,
	targetPct: 45,
	targetMwh: 8000,
	timeline: "Q1 2028",
	ringkasan:
		"Proyek PLTS atap 8 MWp untuk menurunkan konsumsi listrik dari jaringan dan menekan emisi pabrik.",
};

const STEP2: BusinessStep2 = {
	capexRp: 4_200_000_000,
	tenorTahun: 10,
	penghematanRp: 500_000_000,
	pendapatanRp: 10_000_000_000,
	jaminan: "Machinery and equipment",
	fileIds: ["doc_abc123"],
};

describe("step1Errors", () => {
	test("a complete block passes", () => {
		expect(step1Errors(STEP1)).toEqual({});
	});

	test("each missing or invalid field is named", () => {
		expect(step1Errors({ ...STEP1, namaProyek: "  " })).toHaveProperty(
			"namaProyek",
		);
		expect(step1Errors({ ...STEP1, lokasi: "" })).toHaveProperty("lokasi");
		expect(step1Errors({ ...STEP1, sektor: "" })).toHaveProperty("sektor");
		expect(step1Errors({ ...STEP1, konsumsiMwh: -1 })).toHaveProperty(
			"konsumsiMwh",
		);
		expect(step1Errors({ ...STEP1, biayaRp: -1 })).toHaveProperty("biayaRp");
		expect(step1Errors({ ...STEP1, faktorEmisi: -1 })).toHaveProperty(
			"faktorEmisi",
		);
		expect(step1Errors({ ...STEP1, targetMwh: -1 })).toHaveProperty(
			"targetMwh",
		);
	});

	test("target percentage is bounded to 0-100", () => {
		expect(step1Errors({ ...STEP1, targetPct: 101 })).toHaveProperty(
			"targetPct",
		);
		expect(step1Errors({ ...STEP1, targetPct: -1 })).toHaveProperty(
			"targetPct",
		);
		expect(step1Errors({ ...STEP1, targetPct: 0 })).toEqual({});
		expect(step1Errors({ ...STEP1, targetPct: 100 })).toEqual({});
	});

	test("timeline must be a quarter and a year", () => {
		expect(step1Errors({ ...STEP1, timeline: "2028" })).toHaveProperty(
			"timeline",
		);
		expect(step1Errors({ ...STEP1, timeline: "Q5 2028" })).toHaveProperty(
			"timeline",
		);
		expect(step1Errors({ ...STEP1, timeline: "q1 2028" })).toEqual({});
	});

	test("ringkasan is bounded on submit, but only at the top on autosave", () => {
		expect(
			step1Errors({ ...STEP1, ringkasan: "terlalu pendek" }),
		).toHaveProperty("ringkasan");
		expect(
			step1Errors({ ...STEP1, ringkasan: "x".repeat(1001) }),
		).toHaveProperty("ringkasan");
		// Autosave: a half-written summary is not an error, an over-long one is.
		expect(step1Errors({ ringkasan: "baru mulai" }, true)).toEqual({});
		expect(step1Errors({ ringkasan: "x".repeat(1001) }, true)).toHaveProperty(
			"ringkasan",
		);
	});

	test("autosave checks only what was sent, and treats null as cleared", () => {
		// Nothing sent: nothing to complain about.
		expect(step1Errors({}, true)).toEqual({});
		// A sent but empty name is still wrong.
		expect(step1Errors({ namaProyek: "" }, true)).toHaveProperty("namaProyek");
		// Cleared fields are fine while drafting.
		expect(step1Errors({ namaProyek: null, biayaRp: null }, true)).toEqual({});
	});

	test("submit still rejects what autosave allowed to be empty", () => {
		expect(step1Errors({ namaProyek: null })).toHaveProperty("namaProyek");
	});
});

/** Submit mode with one document attached: the shape most assertions want. */
const submitStep2 = (patch: BusinessStep2) => step2Errors(patch, false, 1);

describe("step2Errors", () => {
	test("a complete block with a document passes", () => {
		expect(step2Errors(STEP2, false, 1)).toEqual({});
	});

	test("each missing or invalid field is named", () => {
		expect(step2Errors({ ...STEP2, capexRp: -1 })).toHaveProperty("capexRp");
		expect(step2Errors({ ...STEP2, penghematanRp: -1 })).toHaveProperty(
			"penghematanRp",
		);
		expect(step2Errors({ ...STEP2, pendapatanRp: -1 })).toHaveProperty(
			"pendapatanRp",
		);
		expect(step2Errors({ ...STEP2, jaminan: "" })).toHaveProperty("jaminan");
		expect(step2Errors({ ...STEP2, jaminan: "Emas" })).toHaveProperty(
			"jaminan",
		);
	});

	test("tenor must be a whole number of years between 1 and 30", () => {
		expect(step2Errors({ ...STEP2, tenorTahun: 0 })).toHaveProperty(
			"tenorTahun",
		);
		expect(step2Errors({ ...STEP2, tenorTahun: 31 })).toHaveProperty(
			"tenorTahun",
		);
		expect(step2Errors({ ...STEP2, tenorTahun: 2.5 })).toHaveProperty(
			"tenorTahun",
		);
		expect(submitStep2({ ...STEP2, tenorTahun: 1 })).toEqual({});
		expect(submitStep2({ ...STEP2, tenorTahun: 30 })).toEqual({});
	});

	test("at least one document is required to submit", () => {
		expect(step2Errors(STEP2, false, 0)).toHaveProperty("fileIds");
		// Autosave does not ask for a document yet.
		expect(step2Errors(STEP2, true, 0)).toEqual({});
	});

	test("every accepted collateral form is recognised", () => {
		for (const option of JAMINAN_OPTIONS) {
			expect(submitStep2({ ...STEP2, jaminan: option })).toEqual({});
		}
	});

	test("autosave checks only what was sent", () => {
		expect(step2Errors({}, true)).toEqual({});
		expect(step2Errors({ capexRp: -1 }, true)).toHaveProperty("capexRp");
		expect(step2Errors({ capexRp: null, tenorTahun: null }, true)).toEqual({});
	});
});

describe("validationSummary", () => {
	test("counts the failing fields", () => {
		expect(validationSummary(3)).toContain("3");
	});
});
