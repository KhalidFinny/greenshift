/* Per-step validation. validateStep1 returns error keys and strings that match
 * the dashboard's Step 1 validate() exactly (ADR-003). */

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
	if (!v.namaProyek.trim()) e.namaProyek = "Enter the project name.";
	if (!v.lokasi.trim()) e.lokasi = "Enter the location.";
	if (!v.sektor) e.sektor = "Choose a sector.";
	if (v.konsumsi === null || v.konsumsi < 0)
		e.konsumsi = "Enter a valid number, e.g. 12.500,5.";
	if (v.biaya === null || v.biaya < 0)
		e.biaya = "Enter a valid amount in rupiah, e.g. 4.200.000.000.";
	if (v.faktor === null || v.faktor < 0 || v.faktor > 10)
		e.faktor = "Enter a factor between 0 and 10, e.g. 0,85.";
	const targetValid =
		v.targetPct !== null && v.targetPct >= 0 && v.targetPct <= 100;
	if (!targetValid) e.targetPct = "Enter a value between 0 and 100.";
	if (v.targetMwh === null || v.targetMwh < 0)
		e.targetMwh = "Enter a valid number, e.g. 8.000.";
	if (!/^Q[1-4]\s+\d{4}$/i.test(v.timeline.trim()))
		e.timeline = "Use quarter + year, e.g. Q1 2026.";
	if (v.ringkasan.trim().length < 50) e.ringkasan = "At least 50 characters.";
	if (v.ringkasan.trim().length > 1000)
		e.ringkasan = "At most 1000 characters.";
	return e;
}

/* ADR-004.1-3 + 004.5: CAPEX + tenor + penghematan, financial profile, >= 1 file;
 * same pattern as Step 1 (aria-invalid + inline message). */
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
		e.capex = "Enter a valid CAPEX, e.g. 4.200.000.000.";
	if (
		v.tenor === null ||
		!Number.isInteger(v.tenor) ||
		v.tenor < 1 ||
		v.tenor > 30
	)
		e.tenor = "Enter a tenor between 1 and 30 years.";
	if (v.saving === null || v.saving < 0)
		e.saving = "Enter a valid annual saving, e.g. 500.000.000.";
	if (v.pendapatan === null || v.pendapatan < 0)
		e.pendapatan = "Enter a valid revenue, e.g. 10.000.000.000.";
	if (!v.jaminan) e.jaminan = "Choose a form of collateral.";
	if (v.fileCount < 1) e.files = "Upload at least 1 document.";
	return e;
}

/* Step 3: both scope lists are one entry per line, so the rule counts the entries carrying text. */
export interface Step3Values {
	requirements: string[];
	deliverables: string[];
}

export function validateStep3(v: Step3Values): Record<string, string> {
	const e: Record<string, string> = {};
	if (v.requirements.length === 0)
		e.requirements = "Add at least one key technical requirement.";
	if (v.deliverables.length === 0)
		e.deliverables = "Add at least one deliverable.";
	return e;
}
