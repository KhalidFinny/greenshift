/* Eleanor's reading for the assessment the wizard derived from the form.
 *
 * The wizard has no project row to store a reading on, so the figures travel to
 * the endpoint that composes it. The request is keyed by the figures themselves:
 * the same assessment is asked for once, and an edit that changes the score is a
 * different question. An assessment the API sent already carries its reading, so
 * that one is used as it stands and nothing is requested.
 */

import {
	type AnalystReadingMode,
	api,
	type BusinessRiskInsight,
} from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectRiskResult } from "./project-risk";

/** What the reading is about: any figure that would change it. */
function insightKey(risk: ProjectRiskResult): string {
	return [
		risk.score,
		risk.level,
		risk.success,
		...risk.breakdown.map((row) => `${row.key}:${row.pct}:${row.tone ?? "-"}`),
	].join("|");
}

export interface RiskInsightState {
	insight: BusinessRiskInsight | null;
	/** True while the reading is being written for the current figures. */
	loading: boolean;
	/** True when the endpoint could not answer; the tips below still stand. */
	failed: boolean;
}

export function useRiskInsight(
	risk: ProjectRiskResult | null,
	mode: AnalystReadingMode = "full",
): RiskInsightState {
	const stored = risk?.insight ?? null;
	const query = useQuery({
		queryKey: [
			"business",
			"risk-insight",
			mode,
			risk ? insightKey(risk) : "none",
		],
		queryFn: async () => {
			if (risk === null) throw new Error("no assessment");
			const { insight } = await api.business.riskInsight({
				score: risk.score,
				level: risk.level,
				success: risk.success,
				breakdown: risk.breakdown,
				factors: risk.factors,
				mitigations: risk.mitigations,
				mode,
			});
			return insight;
		},
		// The wizard's figures are stable while the review step is open, and the
		// endpoint caches per assessment, so a reading is fetched once per score.
		enabled: risk !== null && stored === null,
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		insight: stored ?? query.data ?? null,
		loading: stored === null && query.isPending,
		failed: stored === null && query.isError,
	};
}
