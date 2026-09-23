/* Eleanor's reading of the project and its funding case; the figures travel because the wizard has no project row, and key the request. */

import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import type { ProjectFunding } from "./project-funding";
import type { RiskInsightState } from "./use-risk-insight";

export interface ProjectReadingInput extends ProjectFunding {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	jaminan: string | null;
}

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
		// The summary does not edit these figures, so one reading per set of figures is enough.
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	return {
		insight: query.data ?? null,
		loading: query.isPending,
		failed: query.isError,
	};
}
