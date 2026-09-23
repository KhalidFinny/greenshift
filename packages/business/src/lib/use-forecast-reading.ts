/* Eleanor's reading of the ROI forecast the summary shows.
 *
 * Asked for separately from the forecast itself: the scenarios are arithmetic
 * and land at once, while she takes a moment to write about them, so the charts
 * are not held up by the prose. The request is keyed by the figures, so an edit
 * that changes them is a different question and an unchanged one is asked once.
 */

import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";
import type { RiskInsightState } from "./use-risk-insight";

export function useForecastReading(funding: ProjectFunding): RiskInsightState {
	// The engine's own rule for a computable forecast: a capital, a tenor and a
	// saving. Below that there is nothing to read, and the panel says so itself.
	const computable =
		funding.capexRp !== null &&
		funding.capexRp > 0 &&
		funding.tenorTahun !== null &&
		funding.tenorTahun > 0 &&
		funding.penghematanRp !== null &&
		funding.penghematanRp > 0;

	const query = useQuery({
		queryKey: [
			"business",
			"forecast-reading",
			funding.capexRp,
			funding.tenorTahun,
			funding.penghematanRp,
			funding.pendapatanRp,
		],
		queryFn: async () => {
			const { reading } = await api.business.forecastReading(funding);
			return reading;
		},
		enabled: computable,
		// The summary does not edit these figures, so one reading per set of
		// figures is all this asks for.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		insight: query.data ?? null,
		loading: computable && query.isPending,
		failed: query.isError,
	};
}
