/* ADR-002: parse angka format Indonesia. "1.234.567,89" -> 1234567.89 */
export function parseIdNumber(raw: string): number | null {
	const s = raw.trim();
	if (!s) return null;
	const cleaned = s.replace(/[^0-9.,-]/g, "");
	if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".")
		return null;
	const hasComma = cleaned.includes(",");
	const hasDot = cleaned.includes(".");
	let normalized: string;
	if (hasComma && hasDot) {
		normalized = cleaned.replace(/\./g, "").replace(",", ".");
	} else if (hasComma) {
		normalized = cleaned.replace(",", ".");
	} else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
		normalized = cleaned.replace(/\./g, "");
	} else {
		normalized = cleaned;
	}
	const n = Number(normalized);
	return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatId(n: number, digits = 0): string {
	return n.toLocaleString("id-ID", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

/** A file size for the attachment list: 812 B, 340 KB, 1.4 MB. */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${Math.round(kb)} KB`;
	return `${(kb / 1024).toFixed(1)} MB`;
}
