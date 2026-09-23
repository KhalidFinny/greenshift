import type { MatchmakingBreakdown } from "./types";

/** What each criterion of the matching model measures. Static copy, not data: the criteria are fixed by the model, so the API carries only the scores. */
export const MATCH_CRITERIA: ReadonlyArray<{
	key: Exclude<keyof MatchmakingBreakdown, "rank" | "overallMatch">;
	label: string;
	explanation: string;
}> = [
	{
		key: "technicalFit",
		label: "Technical Fit",
		explanation:
			"How closely your declared capabilities and certifications cover the scope of work.",
	},
	{
		key: "relevantExperience",
		label: "Relevant Experience",
		explanation:
			"Your completed projects in this sector and technology, weighted by recency.",
	},
	{
		key: "historicalPerformance",
		label: "Historical Performance",
		explanation:
			"Your client rating and on-time delivery record across past engagements.",
	},
	{
		key: "priceAndValue",
		label: "Price & Value",
		explanation:
			"How your pricing has compared with the amount awarded on similar tenders.",
	},
	{
		key: "projectRisk",
		label: "Project Risk",
		explanation:
			"The assessed risk of the project itself, scored so a higher value means lower risk.",
	},
];

/** Strength band for a weighted total, so the UI never has to invent a verdict. */
export function matchStrength(total: number): {
	label: string;
	className: string;
} {
	if (total >= 85) {
		return { label: "Strong fit", className: "bg-emerald-700 text-white" };
	}
	if (total >= 75) {
		return { label: "Good fit", className: "bg-emerald-700 text-white" };
	}
	return { label: "Fair fit", className: "bg-muted text-foreground" };
}

/** True when the model ranked this vendor first for the project, among the vendors it scored. */
export function isTopMatch(matchmaking: MatchmakingBreakdown | null): boolean {
	return matchmaking !== null && matchmaking.rank === 1;
}
