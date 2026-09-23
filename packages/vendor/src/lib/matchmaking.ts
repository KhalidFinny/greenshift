import type { MatchmakingBreakdown } from "./types";

/** Static copy: the criteria are fixed by the model, so the API carries only scores. */
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

export function isTopMatch(matchmaking: MatchmakingBreakdown | null): boolean {
	return matchmaking !== null && matchmaking.rank === 1;
}
