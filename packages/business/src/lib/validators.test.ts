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
		expect(e.namaProyek).toBe("Nama proyek wajib diisi.");
		expect(e.lokasi).toBe("Lokasi wajib diisi.");
		expect(e.sektor).toBe("Pilih sektor.");
		expect(e.konsumsi).toBe("Isi angka valid, cth. 12.500,5.");
		expect(e.biaya).toBe("Isi rupiah valid, cth. 4.200.000.000.");
		expect(e.faktor).toBe("Isi faktor valid, cth. 0,85.");
		expect(e.targetPct).toBe("Isi 0–100.");
		expect(e.targetMwh).toBe("Isi angka valid, cth. 8.000.");
		expect(e.timeline).toBe("Format kuartal + tahun, cth. Q1 2026.");
		expect(e.ringkasan).toBe("Minimal 50 karakter.");
	});
	test("ringkasan over 1000 chars fails", () => {
		const e = validateStep1({
			...validStep1,
			ringkasan: `x${"y".repeat(1000)}`,
		});
		expect(e.ringkasan).toBe("Maksimal 1000 karakter.");
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
		expect(e.capex).toBe("Isi CAPEX valid, cth. 4.200.000.000.");
		expect(e.tenor).toBe("Isi tenor 1–30 tahun.");
		expect(e.saving).toBe("Isi penghematan valid, cth. 500.000.000.");
		expect(e.pendapatan).toBe("Isi pendapatan valid, cth. 10.000.000.000.");
		expect(e.jaminan).toBe("Pilih bentuk jaminan.");
		expect(e.files).toBe("Unggah minimal 1 dokumen.");
	});
	test("tenor rejects fractions and out-of-range integers", () => {
		expect(validateStep2({ ...validStep2, tenor: 2.5 }).tenor).toBe(
			"Isi tenor 1–30 tahun.",
		);
		expect(validateStep2({ ...validStep2, tenor: 0 }).tenor).toBe(
			"Isi tenor 1–30 tahun.",
		);
		expect(validateStep2({ ...validStep2, tenor: 31 }).tenor).toBe(
			"Isi tenor 1–30 tahun.",
		);
	});
});
