/**
 * Credit and risk scoring, ported line for line from the frontend's
 * `credit-score.ts` and `project-risk.ts`.
 *
 * The server owns these numbers. The frontend keeps its own copy so the wizard
 * can preview them live, which is why both sides must agree: the vectors in the
 * test beside this file are the same ones the frontend suite asserts against.
 *
 * Parameter names deliberately match the frontend lib rather than the wire
 * contract, so the two implementations can be diffed directly. The handlers map
 * the contract's field names onto these.
 */

// ── credit score ──────────────────────────────────────────
// ADR-004.4: a derived score, never a fake one. 0-100 from a debt-service
// proxy (annual saving / (CAPEX / tenor), capped) plus document completeness.
// Missing inputs yield null rather than a fabricated number.
export interface CreditScoreInput {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	docsDone: number;
	docsTotal: number;
}

export interface CreditScoreResult {
	score: number | null;
	rating: string | null;
}

/**
 * Rating bands (ADR-004.4): >= 85 AAA, 75-84 AA, 65-74 A, 55-64 BBB+, 45-54
 * BBB, 35-44 BB, < 35 B.
 */
export function ratingForScore(score: number): string {
	if (score >= 85) return "AAA";
	if (score >= 75) return "AA";
	if (score >= 65) return "A";
	if (score >= 55) return "BBB+";
	if (score >= 45) return "BBB";
	if (score >= 35) return "BB";
	return "B";
}

export function creditScore(input: CreditScoreInput): CreditScoreResult {
	const { capex, tenor, saving, docsDone, docsTotal } = input;
	if (capex === null || tenor === null || tenor <= 0 || saving === null) {
		return { score: null, rating: null };
	}
	const annualDebt = capex / tenor;
	if (!(annualDebt > 0)) return { score: null, rating: null };
	const debtPoints = Math.min(100, Math.max(0, (saving / annualDebt) * 100));
	const docPoints =
		docsTotal > 0
			? Math.min(100, Math.max(0, (docsDone / docsTotal) * 100))
			: 0;
	const score = Math.round(debtPoints * 0.7 + docPoints * 0.3);
	return { score, rating: ratingForScore(score) };
}

// ── project risk ──────────────────────────────────────────
// ADR-006.7: 0-100, the mean of four risk contributions. Finansial, Teknis and
// Implementasi come from Step 1; Pembiayaan comes from the credit score above.
// All inputs empty yields null, never a fabricated figure.
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

// ── tones from the wizard's Step 1 thresholds ─────────────
// The bands the frontend uses to colour each field. Money above 5M is high and
// above 1M is medium; consumption above 10k is high and above 2k is medium.
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

/**
 * Implementation risk from how soon the project lands. A quarter inside the
 * next year is high risk, inside three years medium, later low. An unparseable
 * or missing quarter is unknown rather than assumed.
 */
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
