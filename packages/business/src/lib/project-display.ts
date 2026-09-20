import { formatId } from "./number-format";

/** Status pill colours, keyed by the pill label the API returns. */
export const STATUS_PILL: Record<string, string> = {
	"Review LVV": "bg-amber-50 text-amber-700",
	Matchmaking: "bg-blue-50 text-blue-700",
	Verified: "bg-emerald-50 text-emerald-700",
};

/** "12 Sep 2026" from an ISO timestamp, or an honest blank. */
export function formatSubmittedAt(iso: string | null): string {
	if (!iso) return "Not submitted";
	return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

/** CAPEX in rupiah, or an honest blank. */
export function formatCapex(capexRp: number | null): string {
	return capexRp === null ? "Not filled in" : `Rp ${formatId(capexRp)}`;
}

/** The fields the folded phone line reads. */
export interface FoldableRow {
	submittedAt: string | null;
	capexRp: number | null;
}

/**
 * Submitted and CAPEX as one line for the phone layout. Below `md` their
 * columns are hidden, so their headers can no longer label the values and this
 * line carries the labels.
 */
export function foldedDetail(row: FoldableRow): string {
	return [
		row.submittedAt
			? `Submitted ${formatSubmittedAt(row.submittedAt)}`
			: "Not submitted",
		row.capexRp === null
			? "CAPEX not filled in"
			: `CAPEX ${formatCapex(row.capexRp)}`,
	].join(" · ");
}
