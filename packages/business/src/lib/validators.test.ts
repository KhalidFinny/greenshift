import { describe, expect, test } from "bun:test";
import {
	type Step1Values,
	type Step2Values,
	validateStep1,
	validateStep2,
} from "./validators";

const validStep1: Step1Values = {
	namaProyek: "PLTS Atap Pabrik Cikarang",
	lokasi: "Cikarang, Jawa Barat",
	sektor: "Manufaktur",
	konsumsi: 12500.5,
	biaya: 4_200_000_000,
	faktor: 0.85,
	targetPct: 45,
	targetMwh: 8000,
	timeline: "Q1 2026",
	ringkasan: "Proyek PLTS atap 8 MW untuk pabrik di Cikarang yang mulus.",
};

const validStep2: Step2Values = {
	capex: 4_200_000_000,
	tenor: 10,
	saving: 500_000_000,
	pendapatan: 10_000_000_000,
	jaminan: "Sertifikat Tanah/Bangunan",
	fileCount: 1,
};

describe("validateStep1", () => {
	test("all valid passes", () => {
		expect(validateStep1(validStep1)).toEqual({});
	});
	test("each rule failing reports its exact key", () => {
		const e = validateStep1({
			...validStep1,
			namaProyek: "",
			lokasi: " ",
			sektor: "",
			konsumsi: null,
			biaya: null,
			faktor: null,
			targetPct: 120,
			targetMwh: null,
			timeline: "2026",
			ringkasan: "pendek",
		});
		expect(Object.keys(e).sort()).toEqual([
			"biaya",
			"faktor",
			"konsumsi",
			"lokasi",
			"namaProyek",
			"ringkasan",
			"sektor",
			"targetMwh",
			"targetPct",
			"timeline",
		]);
	});
	test("ringkasan over 1000 chars fails", () => {
		const e = validateStep1({
			...validStep1,
			ringkasan: `x${"y".repeat(1000)}`,
		});
		expect(e).toHaveProperty("ringkasan");
	});
});

describe("validateStep2", () => {
	test("all valid passes", () => {
		expect(validateStep2(validStep2)).toEqual({});
	});
	test("each rule failing reports its exact key", () => {
		const e = validateStep2({
			capex: null,
			tenor: null,
			saving: null,
			pendapatan: null,
			jaminan: "",
			fileCount: 0,
		});
		expect(Object.keys(e).sort()).toEqual([
			"capex",
			"files",
			"jaminan",
			"pendapatan",
			"saving",
			"tenor",
		]);
	});
	test("tenor rejects fractions and out-of-range integers", () => {
		expect(validateStep2({ ...validStep2, tenor: 2.5 })).toHaveProperty(
			"tenor",
		);
		expect(validateStep2({ ...validStep2, tenor: 0 })).toHaveProperty("tenor");
		expect(validateStep2({ ...validStep2, tenor: 31 })).toHaveProperty("tenor");
	});
});
