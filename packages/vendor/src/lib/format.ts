const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("en-US", {
	style: "percent",
	maximumFractionDigits: 1,
});

export function formatRupiah(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return idr.format(value);
}

export function formatCompactRupiah(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	if (value >= 1_000_000_000) {
		const valInBillions = value / 1_000_000_000;
		return `Rp ${Number.isInteger(valInBillions) ? valInBillions : valInBillions.toFixed(1)}B`;
	}
	if (value >= 1_000_000) {
		const valInMillions = value / 1_000_000;
		return `Rp ${Number.isInteger(valInMillions) ? valInMillions : valInMillions.toFixed(1)}M`;
	}
	return formatRupiah(value);
}

export function formatPercent(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return pct.format(value / 100);
}

export function formatMonths(months: number | null | undefined): string {
	if (typeof months !== "number" || !Number.isFinite(months)) return "-";
	return `${months} months`;
}

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return "-";
	return new Date(iso).toLocaleDateString("en-US", { dateStyle: "long" });
}

export function formatShortDate(iso: string | null | undefined): string {
	if (!iso) return "-";
	return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function formatTonnes(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return `${new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 1,
	}).format(value)} tCO₂e`;
}

export function formatCount(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
		value,
	);
}
