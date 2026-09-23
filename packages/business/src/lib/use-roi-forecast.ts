/* The same engine that generates the Green Project Blueprint answers the review step and the project page, keyed by the figures. */

import type { RoiForecast } from "@greenshift/core";
import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";

export interface RoiForecastState {
	forecast: RoiForecast | null;
	loading: boolean;
	failed: boolean;
}

export function useRoiForecast(funding: ProjectFunding): RoiForecastState {
	const query = useQuery({
		queryKey: [
			"business",
			"project-forecast",
			funding.capexRp,
			funding.tenorTahun,
			funding.penghematanRp,
			funding.pendapatanRp,
		],
		queryFn: async () => {
			const { forecast } = await api.business.projectForecast(funding);
			return forecast;
		},
		// The summary does not edit these figures, so one forecast per set of figures is enough.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		forecast: query.data ?? null,
		loading: query.isPending,
		failed: query.isError,
	};
}
