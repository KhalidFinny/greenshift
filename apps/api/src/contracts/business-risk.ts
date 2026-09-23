/** Declared identically on the frontend so the response renders without a cast. */
export const riskTones = ["Low", "Medium", "High"] as const;
export type RiskTone = (typeof riskTones)[number];
export const riskLevels = ["Low", "Medium", "High"] as const;
export type RiskLevel = (typeof riskLevels)[number];

export interface BusinessRiskBreakdown {
	key: string;
	label: string;
	/** Null when the contributing input has not been provided yet. */
	tone: RiskTone | null;
	pct: number;
}

/** Mirrors the frontend `ProjectRiskResult` so it renders untouched. */
export interface BusinessRisk {
	score: number;
	level: RiskLevel;
	success: number;
	breakdown: BusinessRiskBreakdown[];
	factors: string[];
	mitigations: string[];
	summary: string;
	/** Written with the assessment, so it is always about the numbers it travels with. */
	insight: BusinessRiskInsight;
}

/** The figures without the summary she expands on. */
export type BusinessRiskInsightBody = Omit<BusinessRisk, "summary" | "insight">;

export interface BusinessRiskInsight {
	text: string;
	/** `ai` when Workers AI wrote it, `model` when the analyst composed it locally. */
	source: "ai" | "model";
}

/** The wizard's derived assessment, sent because no project row exists yet. */
export interface BusinessRiskInsightRequest extends BusinessRiskInsightBody {
	mode?: AnalystReadingMode;
}

export type AnalystReadingMode = "brief" | "full";

export interface BusinessRiskInsightResponse {
	insight: BusinessRiskInsight;
}

/** Steps 1 and 2 as the wizard holds them, sent for the same reason. */
export interface BusinessProjectReadingRequest {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
}

/** The reading has the same shape wherever it is written: text, and who wrote it. */
export interface BusinessProjectReadingResponse {
	reading: BusinessRiskInsight;
}

export interface BusinessRiskResponse {
	risk: BusinessRisk;
}
