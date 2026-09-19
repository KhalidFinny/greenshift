/* Validasi per-step. validateStep1 mengembalikan key + string error yang
 * sama persis dengan validate() dashboard Step 1 (ADR-003). */

export interface Step1Values {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	konsumsi: number | null;
	biaya: number | null;
	faktor: number | null;
	targetPct: number | null;
	targetMwh: number | null;
	timeline: string;
	ringkasan: string;
}

export function validateStep1(v: Step1Values): Record<string, string> {
	const e: Record<string, string> = {};
	if (!v.namaProyek.trim()) e.namaProyek = "Nama proyek wajib diisi.";
	if (!v.lokasi.trim()) e.lokasi = "Lokasi wajib diisi.";
	if (!v.sektor) e.sektor = "Pilih sektor.";
	if (v.konsumsi === null || v.konsumsi < 0)
		e.konsumsi = "Isi angka valid, cth. 12.500,5.";
	if (v.biaya === null || v.biaya < 0)
		e.biaya = "Isi rupiah valid, cth. 4.200.000.000.";
	if (v.faktor === null || v.faktor < 0)
		e.faktor = "Isi faktor valid, cth. 0,85.";
	const targetValid =
		v.targetPct !== null && v.targetPct >= 0 && v.targetPct <= 100;
	if (!targetValid) e.targetPct = "Isi 0–100.";
	if (v.targetMwh === null || v.targetMwh < 0)
		e.targetMwh = "Isi angka valid, cth. 8.000.";
	if (!/^Q[1-4]\s+\d{4}$/i.test(v.timeline.trim()))
		e.timeline = "Format kuartal + tahun, cth. Q1 2026.";
	if (v.ringkasan.trim().length < 50) e.ringkasan = "Minimal 50 karakter.";
	if (v.ringkasan.trim().length > 1000) e.ringkasan = "Maksimal 1000 karakter.";
	return e;
}

/* ADR-004.1-3 + 004.5: CAPEX + tenor + penghematan, profil keuangan,
 * >= 1 file. Pola sama seperti Step 1: aria-invalid + pesan inline. */
export interface Step2Values {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	pendapatan: number | null;
	jaminan: string;
	fileCount: number;
}

export function validateStep2(v: Step2Values): Record<string, string> {
	const e: Record<string, string> = {};
	if (v.capex === null || v.capex < 0)
		e.capex = "Isi CAPEX valid, cth. 4.200.000.000.";
	if (
		v.tenor === null ||
		!Number.isInteger(v.tenor) ||
		v.tenor < 1 ||
		v.tenor > 30
	)
		e.tenor = "Isi tenor 1–30 tahun.";
	if (v.saving === null || v.saving < 0)
		e.saving = "Isi penghematan valid, cth. 500.000.000.";
	if (v.pendapatan === null || v.pendapatan < 0)
		e.pendapatan = "Isi pendapatan valid, cth. 10.000.000.000.";
	if (!v.jaminan) e.jaminan = "Pilih bentuk jaminan.";
	if (v.fileCount < 1) e.files = "Unggah minimal 1 dokumen.";
	return e;
}
