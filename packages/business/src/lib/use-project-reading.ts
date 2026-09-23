/* Eleanor's reading of the project and its funding case, for the review-step summary and the
 * project page; the figures travel because the wizard has no project row, and key the request. */

import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";
import type { RiskInsightState } from "./use-risk-insight";

/** What the project is, on top of the money the reading is written from. */
export interface ProjectReadingInput extends ProjectFunding {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	/** Free text, and absent when the company offered no collateral. */
	jaminan: string | null;
}

/** The figures the reading is about: any of them changing changes the reading. */
function readingKey(input: ProjectReadingInput): string {
	return [
		input.namaProyek,
		input.lokasi,
		input.sektor,
		input.capexRp,
		input.tenorTahun,
		input.penghematanRp,
		input.pendapatanRp,
		input.jaminan,
	].join("|");
}

export function useProjectReading(
	input: ProjectReadingInput,
): RiskInsightState {
	const query = useQuery({
		queryKey: ["business", "project-reading", readingKey(input)],
		queryFn: async () => {
			const { reading } = await api.business.projectReading(input);
			return reading;
		},
		// The summary does not edit these figures, so one reading per set of
		// figures is all this asks for.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		insight: query.data ?? null,
		loading: query.isPending,
		failed: query.isError,
	};
}
