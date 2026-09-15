/** Badge variants accepted by the ui Badge component. */
export type StatusTone = "default" | "secondary" | "destructive" | "outline";

/**
 * Table/status badge sizing used across admin: enlarged from the DS default
 * so status chips read at the same size as table text.
 */
export const STATUS_BADGE_CLASS = "!h-8 rounded-md px-3 text-base";

export const INVEST_STATUS_LABEL: Record<string, string> = {
	active: "Aktif",
	completed: "Selesai",
	defaulted: "Gagal",
};

export const INVEST_STATUS_TONE: Record<string, StatusTone> = {
	active: "default",
	completed: "secondary",
	defaulted: "destructive",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
	scheduled: "Terjadwal",
	paid: "Terbayar",
	failed: "Gagal",
};

export const PAYMENT_STATUS_TONE: Record<string, StatusTone> = {
	scheduled: "outline",
	paid: "default",
	failed: "destructive",
};

/** Risk label + badge tone from the explainable project readiness score. */
export function riskMeta(score: number | null | undefined): {
	label: string;
	tone: StatusTone;
} {
	if (typeof score !== "number" || !Number.isFinite(score)) {
		return { label: "-", tone: "outline" };
	}
	if (score < 40) return { label: "Rendah", tone: "outline" };
	if (score < 70) return { label: "Sedang", tone: "secondary" };
	return { label: "Tinggi", tone: "destructive" };
}
