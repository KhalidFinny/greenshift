// Minimal PDF writer for the monthly report export: workers cannot run the usual
// PDF libraries, so it emits a valid PDF 1.4 by hand with base-14 fonts.

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const DEFAULT_SIZE = 10;
const BODY_FONT = "F1";
const BOLD_FONT = "F2";

export interface PdfLine {
	text: string;
	/** Point size; defaults to 10. */
	size?: number;
	bold?: boolean;
	/** Extra vertical space (points) inserted before this line. */
	gap?: number;
}

const ASCII_FALLBACKS: Record<string, string> = {
	"\u2018": "'",
	"\u2019": "'",
	"\u201c": '"',
	"\u201d": '"',
	"\u2013": "-",
	"\u2014": "-",
	"\u2022": "-",
	"\u2026": "...",
	"\u00b7": "-",
	"\u00a0": " ",
	"\u2265": ">=",
	"\u2264": "<=",
	"\u00d7": "x",
	"\u20ac": "EUR",
	"\u00e9": "e",
};

/** Base-14 fonts are single-byte; fold anything outside ASCII. */
function toAscii(value: string): string {
	let out = "";
	for (const char of value) {
		if (char === "\n" || char === "\r") {
			out += " ";
			continue;
		}
		const code = char.codePointAt(0) ?? 0;
		if (code >= 32 && code <= 126) {
			out += char;
			continue;
		}
		out += ASCII_FALLBACKS[char] ?? "?";
	}
	return out;
}

function escapeText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\(/g, "\\(")
		.replace(/\)/g, "\\)");
}

/** Approximate Helvetica advance width (0.52 em average, rounded up). */
function wrap(raw: string, size: number): string[] {
	const text = toAscii(raw);
	const maxChars = Math.max(
		16,
		Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.52)),
	);
	if (text.length <= maxChars) return [text];

	const words = text.split(" ");
	const lines: string[] = [];
	let current = "";
	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= maxChars) {
			current = candidate;
			continue;
		}
		if (current) lines.push(current);
		// Long unbreakable tokens (URLs, IDs) are split hard.
		let rest = word;
		while (rest.length > maxChars) {
			lines.push(rest.slice(0, maxChars));
			rest = rest.slice(maxChars);
		}
		current = rest;
	}
	if (current) lines.push(current);
	return lines;
}

function pageStream(lines: PdfLine[]): string {
	let y = PAGE_HEIGHT - MARGIN;
	const parts: string[] = [];
	for (const line of lines) {
		const size = line.size ?? DEFAULT_SIZE;
		const font = line.bold ? BOLD_FONT : BODY_FONT;
		y -= (line.gap ?? 0) + size * 1.4;
		parts.push(
			`BT /${font} ${size} Tf 1 0 0 1 ${MARGIN} ${y.toFixed(2)} Tm (${escapeText(toAscii(line.text))}) Tj ET`,
		);
	}
	return parts.join("\n");
}

/** Build the page chunks, starting a new page when the frame is full. */
function paginate(lines: PdfLine[]): PdfLine[][] {
	const pages: PdfLine[][] = [];
	let current: PdfLine[] = [];
	let y = PAGE_HEIGHT - MARGIN;

	for (const line of lines) {
		const size = line.size ?? DEFAULT_SIZE;
		const height = (line.gap ?? 0) + size * 1.4;
		if (y - height < MARGIN) {
			pages.push(current);
			current = [];
			y = PAGE_HEIGHT - MARGIN;
		}
		for (const wrapped of wrap(line.text, size)) {
			const wrappedHeight = size * 1.4;
			if (y - wrappedHeight < MARGIN) {
				pages.push(current);
				current = [];
				y = PAGE_HEIGHT - MARGIN;
			}
			current.push({ ...line, text: wrapped });
			y -= wrappedHeight;
		}
	}
	pages.push(current);
	return pages.filter((page) => page.length > 0);
}

// Every glyph is ASCII (see toAscii), so the returned string is byte-identical
// to its UTF-8 encoding and the xref offsets stay valid as a response body.
export function renderTextPdf(lines: PdfLine[]): string {
	const pages = paginate(lines.length > 0 ? lines : [{ text: " " }]);

	// Object 1 catalogue, 2 page tree, 3/4 fonts, then page/content pairs.
	const objects: string[] = [];
	const pageObjectNumbers = pages.map((_, index) => 5 + index * 2);

	objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
	objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers
		.map((n) => `${n} 0 R`)
		.join(" ")}] /Count ${pages.length} >>`;
	objects[2] =
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
	objects[3] =
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

	pages.forEach((pageLines, index) => {
		const pageNumber = pageObjectNumbers[index];
		const contentNumber = pageNumber + 1;
		const content = pageStream(pageLines);
		objects[pageNumber - 1] =
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
			`/Resources << /Font << /${BODY_FONT} 3 0 R /${BOLD_FONT} 4 0 R >> >> ` +
			`/Contents ${contentNumber} 0 R >>`;
		objects[contentNumber - 1] =
			`<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
	});

	let pdf = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((body, index) => {
		offsets[index] = pdf.length;
		pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
	});

	const xrefOffset = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) {
		pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
	}
	pdf +=
		`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
		`startxref\n${xrefOffset}\n%%EOF\n`;

	return pdf;
}
