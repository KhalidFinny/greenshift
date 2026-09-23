/* The ROI forecast for the project summary.
 *
 * The figures travel and the scenarios come back: the same engine the Green
 * Project Blueprint is generated with answers both the review step, before
 * there is a project to read, and the project's own page, from the stored
 * figures. The request is keyed by the figures themselves, so an edit that
 * changes them is a different question and an unchanged one is asked once.
 */

import type { RoiForecast } from "@greenshift/core";
import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";

export interface RoiForecastState {
	/** Null while the figures are not complete enough for a forecast. */
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
		// The summary does not edit these figures, so one forecast per set of
		// figures is all this asks for.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		forecast: query.data ?? null,
		loading: query.isPending,
		failed: query.isError,
	};
}
