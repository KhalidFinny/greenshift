/* Eleanor's reading of the project and its funding case, for the summary the
 * review step opens with.
 *
 * The figures travel the other way round from the risk insight: they are sent,
 * because the project does not exist yet for the server to read. The request is
 * keyed by the figures themselves, so an edit that changes them is a different
 * question and an unchanged one is asked once.
 */

import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import { parseIdNumber } from "./number-format";
import type { RiskInsightState } from "./use-risk-insight";

/** The Step 1 and Step 2 fields the reading is written from. */
export interface ProjectReadingInput {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	capex: string;
	tenor: string;
	saving: string;
	pendapatan: string;
	jaminan: string;
}

/** The figures as the endpoint reads them: numbers where they parse, else null. */
function readingBody(input: ProjectReadingInput) {
	return {
		namaProyek: input.namaProyek,
		lokasi: input.lokasi,
		sektor: input.sektor,
		capexRp: parseIdNumber(input.capex),
		tenorTahun: parseIdNumber(input.tenor),
		penghematanRp: parseIdNumber(input.saving),
		pendapatanRp: parseIdNumber(input.pendapatan),
		jaminan: input.jaminan.trim() ? input.jaminan : null,
	};
}

/** The figures the reading is about: any of them changing changes the reading. */
function readingKey(input: ProjectReadingInput): string {
	const body = readingBody(input);
	return [
		body.namaProyek,
		body.lokasi,
		body.sektor,
		body.capexRp,
		body.tenorTahun,
		body.penghematanRp,
		body.pendapatanRp,
		body.jaminan,
	].join("|");
}

export function useProjectReading(
	input: ProjectReadingInput,
): RiskInsightState {
	const query = useQuery({
		queryKey: ["business", "project-reading", readingKey(input)],
		queryFn: async () => {
			const { reading } = await api.business.projectReading(readingBody(input));
			return reading;
		},
		// The review step does not edit these fields, so one reading per set of
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
