// Project risk, mirroring the frontend's `project-risk.ts`: the parameters match it, not the wire contract.

export type { CreditScoreInput, CreditScoreResult } from "./credit-score";
export { creditScore, ratingForScore } from "./credit-score";

// ADR-006.7: 0-100, the mean of four contributions; empty yields null.
export type ProjectRiskTone = "Low" | "Medium" | "High" | null;

export type ProjectRiskLevel = "Low" | "Medium" | "High";

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

/** Tone to risk percentage: the three bands the wizard's thresholds map onto. */
export function toneToPct(tone: ProjectRiskTone): number {
	switch (tone) {
		case "Low":
			return 15;
		case "Medium":
			return 55;
		case "High":
			return 85;
		default:
			return 0;
	}
}

/** Financing risk is the inverse of the credit score. */
export function pembiayaanTone(creditScore: number | null): ProjectRiskTone {
	if (creditScore === null) return null;
	if (creditScore >= 55) return "Low";
	if (creditScore >= 35) return "Medium";
	return "High";
}

export function levelForRiskScore(score: number): ProjectRiskLevel {
	if (score < 40) return "Low";
	if (score < 70) return "Medium";
	return "High";
}

const MITIGATIONS: string[] = [
	"Upload the supporting documents that are still missing before submitting.",
	"Strengthen the financing structure: tenor, collateral, projected saving.",
	"Review the technical assumptions and the implementation schedule with your team.",
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
			label: "Financial",
			tone: finansial,
			pct: toneToPct(finansial),
		},
		{ key: "teknis", label: "Technical", tone: teknis, pct: toneToPct(teknis) },
		{
			key: "implementasi",
			label: "Implementation",
			tone: implementasi,
			pct: toneToPct(implementasi),
		},
		{
			key: "pembiayaan",
			label: "Financing",
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
		if (row.tone === "High") factors.push(`${row.label} risk is high`);
	}
	const docRatio = docsTotal > 0 ? docsDone / docsTotal : 0;
	if (docRatio < 0.5) factors.push("Document completeness is low");

	let worst = breakdown[0];
	for (const row of breakdown) {
		if (row.pct > worst.pct) worst = row;
	}
	const summary = `Overall project risk: ${level}. Highest area: ${worst.label}.`;

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

// Bands the frontend uses to colour each field: money above 5M is high and above 1M medium.
const BIAYA_TINGGI = 5_000_000;
const BIAYA_SEDANG = 1_000_000;
const KONSUMSI_TINGGI = 10_000;
const KONSUMSI_SEDANG = 2_000;
/** Timeline pressure: the nearer the quarter, the higher the implementation risk. */
const TIMELINE_NEAR_YEARS = 1;
const TIMELINE_MID_YEARS = 3;

export function finansialTone(biayaRp: number | null): ProjectRiskTone {
	if (biayaRp === null) return null;
	if (biayaRp > BIAYA_TINGGI) return "High";
	if (biayaRp > BIAYA_SEDANG) return "Medium";
	return "Low";
}

export function teknisTone(konsumsiMwh: number | null): ProjectRiskTone {
	if (konsumsiMwh === null) return null;
	if (konsumsiMwh > KONSUMSI_TINGGI) return "High";
	if (konsumsiMwh > KONSUMSI_SEDANG) return "Medium";
	return "Low";
}

// Risk from how soon the project lands: inside a year high, inside three years medium; an unparseable quarter is unknown.
export function implementasiTone(
	timelineQuarter: string | null,
	now: Date = new Date(),
): ProjectRiskTone {
	if (!timelineQuarter) return null;
	const match = /^Q([1-4])\s+(\d{4})$/i.exec(timelineQuarter.trim());
	if (!match) return null;
	const year = Number(match[2]);
	const yearsOut = year - now.getUTCFullYear();
	if (yearsOut <= TIMELINE_NEAR_YEARS) return "High";
	if (yearsOut <= TIMELINE_MID_YEARS) return "Medium";
	return "Low";
}
