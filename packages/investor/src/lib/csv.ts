type CsvCell = string | number | null | undefined;

function csvCell(value: CsvCell): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	// RFC 4180: quote when the cell contains a separator, quote, or newline.
	return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Client-side CSV download (escrow/ROI history export — the proposal's
 * "riwayat transaksi dapat diunduh investor" is fulfilled without a backend
 * endpoint since every row is already in the portfolio detail payload).
 */
export function downloadCsv(
	filename: string,
	headers: string[],
	rows: CsvCell[][],
): void {
	const content = [headers, ...rows]
		.map((cells) => cells.map(csvCell).join(","))
		.join("\n");
	// BOM so spreadsheet apps detect UTF-8 (period labels use en dashes).
	const blob = new Blob([`\uFEFF${content}\n`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
