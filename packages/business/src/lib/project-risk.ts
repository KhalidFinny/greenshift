/* ADR-006.7: derived, not stored. Score 0-100, the mean of the three tones and the Step 2 credit score; empty inputs -> null. */

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

export interface Step1RiskTones {
	finansial: ProjectRiskTone;
	teknis: ProjectRiskTone;
	implementasi: ProjectRiskTone;
}

/** ADR-003: the Step 1 tones are derived, never stored; the preview and projectRisk both read this. */
export function step1RiskTones(input: {
	biaya: number | null;
	konsumsi: number | null;
	timelineYear: number | null;
	docsDone: number;
	docsTotal: number;
	currentYear: number;
}): Step1RiskTones {
	const { biaya, konsumsi, timelineYear, docsDone, docsTotal, currentYear } =
		input;
	return {
		finansial:
			biaya === null
				? null
				: biaya > 5_000_000_000
					? "High"
					: biaya > 1_000_000_000
						? "Medium"
						: "Low",
		teknis:
			konsumsi === null
				? null
				: konsumsi > 10_000
					? "High"
					: konsumsi > 2_000
						? "Medium"
						: "Low",
		implementasi:
			timelineYear === null && docsDone === 0
				? null
				: docsDone === 0 ||
						(timelineYear !== null && timelineYear < currentYear + 1)
					? "High"
					: docsDone < docsTotal
						? "Medium"
						: "Low",
	};
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
	/** Eleanor's written reading; the API returns one with every project it reads back, absent on a wizard-composed assessment. */
	insight?: { text: string; source: "ai" | "model" } | null;
}

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
