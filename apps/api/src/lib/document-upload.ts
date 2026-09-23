/** A certificate is a scan: 10 MB is generous for a legible one. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

// Extensions are checked alongside the MIME type because scanners and browsers
// report PDFs and images inconsistently.
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"] as const;
const ALLOWED_TYPES: readonly string[] = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
];

function extensionOf(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAcceptedDocument(file: File): boolean {
	return (
		(ALLOWED_EXTENSIONS as readonly string[]).includes(
			extensionOf(file.name),
		) || ALLOWED_TYPES.includes(file.type)
	);
}

/** What the multipart envelope around one file costs: boundaries, part headers. */
export const MULTIPART_ENVELOPE_SLACK = 8 * 1024;
