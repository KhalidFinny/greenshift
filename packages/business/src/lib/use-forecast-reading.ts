/* Eleanor's reading of the ROI forecast, asked separately so the arithmetic scenarios land at once; keyed by the figures. */

import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";
import type { RiskInsightState } from "./use-risk-insight";

export function useForecastReading(funding: ProjectFunding): RiskInsightState {
	// The engine's own rule for a computable forecast: a capital, a tenor and a saving.
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
		// The summary does not edit these figures, so one reading per set of figures is enough.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		insight: query.data ?? null,
		loading: computable && query.isPending,
		failed: query.isError,
	};
}
