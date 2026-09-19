/* ADR-006.7: Project Risk Assessment turunan (bukan statis).
 * Skor 0-100 = rata-rata empat kontribusi risiko (Finansial/Teknis/
 * Implementasi dari tone Langkah 1 + Pembiayaan dari credit score
 * Langkah 2). Input kosong semua -> null, tidak pernah angka palsu.
 */

export type ProjectRiskTone = "Rendah" | "Sedang" | "Tinggi" | null;

export type ProjectRiskLevel = "Rendah" | "Moderat" | "Tinggi";

export interface ProjectRiskInput {
	finansial: ProjectRiskTone;
	teknis: ProjectRiskTone;
	implementasi: ProjectRiskTone;
	creditScore: number | null;
	docsDone: number;
	docsTotal: number;
}

export interface ProjectRiskBreakdown {
	key: string;
	label: string;
	tone: ProjectRiskTone;
	pct: number;
}

export interface ProjectRiskResult {
	score: number;
	level: ProjectRiskLevel;
	success: number;
	breakdown: ProjectRiskBreakdown[];
	factors: string[];
	mitigations: string[];
	summary: string;
}

export function toneToPct(tone: ProjectRiskTone): number {
	switch (tone) {
		case "Rendah":
			return 15;
		case "Sedang":
			return 55;
		case "Tinggi":
			return 85;
		default:
			return 0;
	}
}

export function pembiayaanTone(creditScore: number | null): ProjectRiskTone {
	if (creditScore === null) return null;
	if (creditScore >= 55) return "Rendah";
	if (creditScore >= 35) return "Sedang";
	return "Tinggi";
}

export function levelForRiskScore(score: number): ProjectRiskLevel {
	if (score < 40) return "Rendah";
	if (score < 70) return "Moderat";
	return "Tinggi";
}

const MITIGATIONS: string[] = [
	"Lengkapi dokumen pendukung yang belum diunggah sebelum kirim.",
	"Perkuat struktur pembiayaan (tenor, agunan, proyeksi penghematan).",
	"Tinjau ulang asumsi teknis dan jadwal implementasi bersama tim.",
];

export function projectRisk(input: ProjectRiskInput): ProjectRiskResult | null {
	const { finansial, teknis, implementasi, creditScore, docsDone, docsTotal } =
		input;
	if (
		finansial === null &&
		teknis === null &&
		implementasi === null &&
		creditScore === null &&
		docsTotal === 0
	) {
		return null;
	}

	const pembiayaanPct = creditScore === null ? 0 : 100 - creditScore;
	const breakdown: ProjectRiskBreakdown[] = [
		{
			key: "finansial",
			label: "Finansial",
			tone: finansial,
			pct: toneToPct(finansial),
		},
		{ key: "teknis", label: "Teknis", tone: teknis, pct: toneToPct(teknis) },
		{
			key: "implementasi",
			label: "Implementasi",
			tone: implementasi,
			pct: toneToPct(implementasi),
		},
		{
			key: "pembiayaan",
			label: "Pembiayaan",
			tone: pembiayaanTone(creditScore),
			pct: pembiayaanPct,
		},
	];
	const score = Math.round(
		breakdown.reduce((n, b) => n + b.pct, 0) / breakdown.length,
	);
	const level = levelForRiskScore(score);
	const success = 100 - score;

	const factors: string[] = [];
	for (const row of breakdown) {
		if (row.tone === "Tinggi") factors.push(`Risiko ${row.label} tinggi`);
	}
	const docRatio = docsTotal > 0 ? docsDone / docsTotal : 0;
	if (docRatio < 0.5) factors.push("Kelengkapan dokumen rendah");

	let worst = breakdown[0];
	for (const row of breakdown) {
		if (row.pct > worst.pct) worst = row;
	}
	const summary = `Risiko proyek ${level} — area tertinggi: ${worst.label}.`;

	return {
		score,
		level,
		success,
		breakdown,
		factors,
		mitigations: [...MITIGATIONS],
		summary,
	};
}
