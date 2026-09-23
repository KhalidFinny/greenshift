export interface ExportSection {
	title: string;
	headers: string[];
	rows: string[][];
}

export type ExportFormat = "csv" | "pdf";

function triggerDownload(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

// Excel-compatible: UTF-8 BOM and CRLF line endings.
export function downloadCsv(filename: string, sections: ExportSection[]): void {
	const lines: string[] = [];
	for (const section of sections) {
		if (lines.length > 0) lines.push("");
		lines.push(section.title);
		lines.push(section.headers.map(csvCell).join(","));
		for (const row of section.rows) {
			lines.push(row.map(csvCell).join(","));
		}
	}
	const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
		type: "text/csv;charset=utf-8",
	});
	triggerDownload(
		filename.endsWith(".csv") ? filename : `${filename}.csv`,
		blob,
	);
}

// Minimal PDF writer: A4, Helvetica, no dependencies.
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;
const LINE_HEIGHT = 14;

function pdfEscape(value: string): string {
	let out = "";
	for (const ch of value) {
		const code = ch.codePointAt(0) ?? 0;
		if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
			out += ch;
		} else {
			out += "?";
		}
	}
	return out.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function downloadPdf(
	filename: string,
	title: string,
	sections: ExportSection[],
): void {
	const pageStreams: string[] = [];
	let content = "";
	let y = PAGE_HEIGHT - MARGIN;

	const ensureLine = () => {
		if (y - LINE_HEIGHT < MARGIN) {
			pageStreams.push(content);
			content = "";
			y = PAGE_HEIGHT - MARGIN;
		}
	};

	const writeTitle = (text: string, size: number, bold: boolean) => {
		ensureLine();
		content += `BT /${bold ? "F2" : "F1"} ${size} Tf ${MARGIN} ${y} Td (${text}) Tj ET\n`;
		y -= LINE_HEIGHT;
	};

	writeTitle(pdfEscape(title), 14, true);
	y -= 8;

	for (const section of sections) {
		if (y < MARGIN + 60) {
			pageStreams.push(content);
			content = "";
			y = PAGE_HEIGHT - MARGIN;
		}
		writeTitle(pdfEscape(section.title), 11, true);
		y -= 4;

		const colCount = Math.max(section.headers.length, 1);
		const colWidth = (PAGE_WIDTH - MARGIN * 2) / colCount;

		const writeRow = (cells: string[], size: number, bold: boolean) => {
			ensureLine();
			const maxChars = Math.max(1, Math.floor(colWidth / (size * 0.5)) - 1);
			cells.forEach((cell, i) => {
				const x = MARGIN + i * colWidth;
				content += `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(cell).slice(0, maxChars)}) Tj ET\n`;
			});
			y -= LINE_HEIGHT;
		};

		writeRow(section.headers, 9, true);
		for (const row of section.rows) writeRow(row, 9, false);
		y -= 6;
	}
	pageStreams.push(content);

	const objects: string[] = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		`<< /Type /Pages /Kids [${pageStreams
			.map((_, i) => `${3 + i * 2} 0 R`)
			.join(" ")}] /Count ${pageStreams.length} >>`,
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
	];
	pageStreams.forEach((stream, i) => {
		const pageNum = 3 + i * 2;
		const contentNum = pageNum + 1;
		objects.push(
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents ${contentNum} 0 R >>`,
		);
		objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
	});

	let pdf = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((body, i) => {
		offsets.push(pdf.length);
		pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
	});
	const xrefStart = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) {
		pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
	}
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

	const blob = new Blob([pdf], { type: "application/pdf" });
	triggerDownload(
		filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
		blob,
	);
}

export function downloadExport(
	filename: string,
	title: string,
	sections: ExportSection[],
	format: ExportFormat,
): void {
	if (format === "csv") downloadCsv(filename, sections);
	else downloadPdf(filename, title, sections);
}
