import { formatId } from "./number-format";

/** Status pill colours, keyed by the pill label the API returns. */
export const STATUS_PILL: Record<string, string> = {
	// The verification step's two labels: the registry registration that opens
	// it, and the LVV verification itself. Both carry the stage's amber.
	"Register for LVV": "bg-amber-50 text-amber-700",
	"Awaiting LVV verification": "bg-amber-50 text-amber-700",
	Matchmaking: "bg-blue-50 text-blue-700",
	Verified: "bg-emerald-50 text-emerald-700",
};

/** "12 Sep 2026" from an ISO timestamp, or an honest blank. */
export function formatSubmittedAt(iso: string | null): string {
	if (!iso) return "Not submitted";
	return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

/** Rupiah, or an honest blank. */
export function formatRupiah(value: number | null): string {
	return value === null ? "Not filled in" : `Rp ${formatId(value)}`;
}

/** Years to a figure's own precision, or an honest blank. */
export function formatYears(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(value, 1)} years`;
}

/** A whole per cent, or an honest blank. */
export function formatPercent(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(Math.round(value))}%`;
}

/** Tonnes of CO2e for a year, to one decimal. */
export function formatTonnes(value: number): string {
	return `${formatId(value, 1)} tCO₂`;
}

/**
 * Rupiah at a chart axis' scale: a tick reads "Rp 4,2 M" rather than the ten
 * digits a financial statement carries, with the sign kept because the
 * projection lines run below zero before the capital is recovered.
 */
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
			: `CAPEX ${formatRupiah(row.capexRp)}`,
	].join(" · ");
}
