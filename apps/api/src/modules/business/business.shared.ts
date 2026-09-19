import type {
	BusinessDocument,
	BusinessDraft,
	BusinessStep1Patch,
	BusinessStep2Patch,
	BusinessStep3,
} from "../../contracts";
import type { draftDocuments, drafts, projectDocuments } from "../../db/schema";
import { iso } from "../../lib/format";

/** Upload limits for wizard documents. */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

/**
 * Accepted document types. Extensions are checked alongside the MIME type
 * because browsers report spreadsheets inconsistently, often as
 * `application/octet-stream`.
 */
export const ALLOWED_DOCUMENT_EXTENSIONS = [
	"pdf",
	"xls",
	"xlsx",
	"png",
	"jpg",
	"jpeg",
] as const;

export const ALLOWED_DOCUMENT_TYPES: readonly string[] = [
	"application/pdf",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"image/png",
	"image/jpeg",
];

/**
 * The slot vocabulary, so an upload cannot invent a checklist entry. Mirrors
 * the frontend: the Step 1 trio, Step 2's two financial documents, and the
 * Step 3 six.
 */
export const DOCUMENT_SLOTS = [
	"tagihan",
	"beban",
	"izin",
	"lapkeu",
	"rab",
	"akta",
	"nib",
	"profil",
	"studi",
	"dram",
	"spek",
] as const;

/** Slots the Step 3 checklist requires; used for the document completeness ratio. */
export const STEP3_SLOTS = [
	"akta",
	"nib",
	"profil",
	"studi",
	"dram",
	"spek",
] as const;

/** The Step 1 document trio. */
export const STEP1_SLOTS = ["tagihan", "beban", "izin"] as const;

/**
 * The wizard's checklist: the Step 1 trio plus the Step 3 six. Nine slots, and
 * the denominator both the credit score and the risk model use for document
 * completeness. Mirrors `REQUIRED_DOCS` and the Step 3 list in the frontend.
 */
export const CHECKLIST_SLOTS = [...STEP1_SLOTS, ...STEP3_SLOTS] as const;

/** The client generates the draft id, so it is bounded rather than trusted. */
export const MAX_DRAFT_ID = 64;

/** Narrows a path segment to a usable draft id. */
export function validDraftId(value: string | undefined): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length <= MAX_DRAFT_ID &&
		!value.includes("/")
	);
}

export function isDocumentSlot(value: unknown): value is string {
	return (
		typeof value === "string" &&
		(DOCUMENT_SLOTS as readonly string[]).includes(value)
	);
}

/**
 * The pill label for a project status. The list shows this rather than the raw
 * enum, so the mapping lives here rather than in the page.
 */
export function pillStatus(status: string): string {
	switch (status) {
		case "assessment":
			return "Review LVV";
		case "tendering":
		case "funding":
			return "Matchmaking";
		case "blueprint":
		case "monitoring":
		case "completed":
			return "Verified";
		default:
			return status;
	}
}

/** The merged wizard blocks, as stored in `drafts.payload`. */
export interface StoredDraftPayload {
	step1?: BusinessStep1Patch | null;
	step2?: BusinessStep2Patch | null;
	step3?: BusinessStep3 | null;
}

/**
 * The stored payload is the client's own blocks, written through the autosave
 * validator, so it is read back as those blocks rather than re-derived.
 */
export function readPayload(payload: unknown): StoredDraftPayload {
	return (payload ?? {}) as StoredDraftPayload;
}

export function draftEntry(row: typeof drafts.$inferSelect): BusinessDraft {
	const payload = readPayload(row.payload);
	return {
		id: row.id,
		step: row.step,
		updatedAt: iso(row.updatedAt),
		step1: payload.step1 ?? null,
		step2: payload.step2 ?? null,
		step3: payload.step3 ?? null,
	};
}

/**
 * An uploaded wizard file. `downloadUrl` is only offered once OCR has finished,
 * so the UI cannot link to a file that is not readable yet.
 */
export function draftDocumentEntry(
	row: typeof draftDocuments.$inferSelect,
): BusinessDocument {
	return {
		id: row.id,
		slot: row.slot,
		fileName: row.fileName,
		ocrStatus: "pending",
	};
}

/** A document on a submitted project. */
export function projectDocumentEntry(
	row: typeof projectDocuments.$inferSelect,
	projectId: number,
): BusinessDocument {
	const ready = row.ocrStatus !== "pending" && row.ocrStatus !== "processing";
	return {
		id: String(row.id),
		slot: row.type,
		fileName: row.fileName,
		ocrStatus: row.ocrStatus,
		downloadUrl: ready
			? `/api/business/projects/${projectId}/documents/${row.id}/download`
			: null,
	};
}
