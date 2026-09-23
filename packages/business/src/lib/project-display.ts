import { formatId } from "./number-format";

/** Status pill colours, keyed by the pill label the API returns. */
export const STATUS_PILL: Record<string, string> = {
	// The verification step's two labels both carry the stage's amber.
	"Register for LVV": "bg-amber-50 text-amber-700",
	"Awaiting LVV verification": "bg-amber-50 text-amber-700",
	Matchmaking: "bg-blue-50 text-blue-700",
	Verified: "bg-emerald-50 text-emerald-700",
};

export function formatSubmittedAt(iso: string | null): string {
	if (!iso) return "Not submitted";
	return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

export function formatRupiah(value: number | null): string {
	return value === null ? "Not filled in" : `Rp ${formatId(value)}`;
}

export function formatYears(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(value, 1)} years`;
}

export function formatPercent(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(Math.round(value))}%`;
}

export function formatTonnes(value: number): string {
	return `${formatId(value, 1)} tCO₂`;
}

/** Chart-axis rupiah ("Rp 4,2 M"); the sign is kept because the projection lines run below zero. */
export function formatCompactRupiah(value: number): string {
	const sign = value < 0 ? "-" : "";
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000_000) {
		return `${sign}Rp ${formatId(abs / 1_000_000_000_000, 1)} T`;
	}
	if (abs >= 1_000_000_000) {
		return `${sign}Rp ${formatId(abs / 1_000_000_000, 1)} M`;
	}
	if (abs >= 1_000_000) {
		return `${sign}Rp ${formatId(abs / 1_000_000, 1)} jt`;
	}
	return `${sign}Rp ${formatId(abs)}`;
}

export interface FoldableRow {
	submittedAt: string | null;
	capexRp: number | null;
}

/** Submitted and CAPEX as one line; below md their columns are hidden, so this carries the labels their headers no longer show. */
export function foldedDetail(row: FoldableRow): string {
	return [
		row.submittedAt
			? `Submitted ${formatSubmittedAt(row.submittedAt)}`
			: "Not submitted",
		row.capexRp === null
			? "CAPEX not filled in"
			: `CAPEX ${formatRupiah(row.capexRp)}`,
	].join(" · ");
}
