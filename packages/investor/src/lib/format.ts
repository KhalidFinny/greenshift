const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("id-ID", {
	maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("id-ID", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const month = new Intl.DateTimeFormat("id-ID", { month: "short" });

export function formatIdr(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return idr.format(value);
}

export function formatNumber(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return number.format(value);
}

/** Emission values in tonnes of CO₂e, e.g. "49,8 tCO₂e". */
export function formatTonnes(value: number | null | undefined): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "-";
	return `${new Intl.NumberFormat("id-ID", {
		maximumFractionDigits: 1,
	}).format(value)} tCO₂e`;
}

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return "-";
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return "-";
	return date.format(parsed);
}

/** Short month label from a YYYY-MM key, e.g. "Mei 26". */
export function monthLabel(key: string): string {
	const [year, monthIndex] = key.split("-").map(Number);
	if (!year || monthIndex === undefined || monthIndex < 1 || monthIndex > 12) {
		return key;
	}
	const name = month.format(new Date(year, monthIndex - 1, 1));
	return `${name} ${String(year).slice(2)}`;
}

/** Quarter key of a date, e.g. "2026-Q3". */
export function quarterKey(date: Date): string {
	return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

/** Short label from a "YYYY-Qn" key, e.g. "Q3 26". */
export function quarterLabel(key: string | null | undefined): string {
	const match = /^(\d{4})-Q([1-4])$/.exec(key ?? "");
	if (!match) return key ?? "-";
	return `Q${match[2]} ${match[1].slice(2)}`;
}

/** First letter uppercased: seeds store sectors lowercase ("tekstil"). */
export function titleCase(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
