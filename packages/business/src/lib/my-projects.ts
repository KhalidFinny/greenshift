import { type ProjectRiskResult, projectRisk } from "./project-risk";
export type MyProjectStatus = "Review LVV" | "Matchmaking" | "Verified";

export interface MyProject {
	id: string;
	name: string;
	location: string;
	sector: string;
	submittedAt: string;
	capex: number | null;
	status: MyProjectStatus;
}

export const MY_PROJECTS: MyProject[] = [
	{
		id: "mp-1",
		name: "PLTS Atap Pabrik Cikarang",
		location: "Cikarang, Jawa Barat",
		sector: "Manufaktur",
		submittedAt: "12 Agustus 2026",
		capex: 4_200_000_000,
		status: "Review LVV",
	},
	{
		id: "mp-2",
		name: "PLTS Ground-Mounted Karawang",
		location: "Karawang, Jawa Barat",
		sector: "Energi Terbarukan",
		submittedAt: "28 Juli 2026",
		capex: 12_750_000_000,
		status: "Matchmaking",
	},
	{
		id: "mp-3",
		name: "Efisiensi Boiler Pabrik Gresik",
		location: "Gresik, Jawa Timur",
		sector: "Manufaktur",
		submittedAt: "3 Juni 2026",
		capex: 2_850_000_000,
		status: "Verified",
	},
];
/* Client-side summary download (grill Round 12): builds a plain-text
 * recap of the row so Unduh Dokumen does something real offline. */
export function projectSummaryText(p: MyProject): string {
	return [
		`Proyek: ${p.name}`,
		`Lokasi: ${p.location}`,
		`Sektor: ${p.sector}`,
		`Tanggal Pengajuan: ${p.submittedAt}`,
		`Nilai CAPEX: ${p.capex === null ? "-" : `Rp ${p.capex.toLocaleString("id-ID")}`}`,
		`Status: ${p.status}`,
	].join("\n");
}

export function downloadProjectSummary(p: MyProject): void {
	const blob = new Blob([projectSummaryText(p)], {
		type: "text/plain;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${p.id}-ringkasan.txt`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/* Demo assessment per row (grill Round 11): the list has no Step 1–3
 * inputs, so each status maps to fixed representative tones fed through
 * the real projectRisk(). Labeled "data contoh" in the UI. */
export function demoRiskForStatus(status: MyProjectStatus): ProjectRiskResult {
	switch (status) {
		case "Review LVV":
			return projectRisk({
				finansial: "Sedang",
				teknis: "Tinggi",
				implementasi: "Tinggi",
				creditScore: 57,
				docsDone: 3,
				docsTotal: 11,
			}) as ProjectRiskResult;
		case "Matchmaking":
			return projectRisk({
				finansial: "Rendah",
				teknis: "Sedang",
				implementasi: "Sedang",
				creditScore: 68,
				docsDone: 7,
				docsTotal: 11,
			}) as ProjectRiskResult;
		case "Verified":
			return projectRisk({
				finansial: "Rendah",
				teknis: "Rendah",
				implementasi: "Rendah",
				creditScore: 82,
				docsDone: 11,
				docsTotal: 11,
			}) as ProjectRiskResult;
	}
}
