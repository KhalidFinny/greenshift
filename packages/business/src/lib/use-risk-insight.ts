/* Eleanor's reading for the assessment the wizard derived; the figures travel because the wizard has no project row. */

import {
	type AnalystReadingMode,
	api,
	type BusinessRiskInsight,
} from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectRiskResult } from "./project-risk";

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
	loading: boolean;
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
		// The figures are stable while the review step is open and the endpoint caches per assessment, so one fetch per score.
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
