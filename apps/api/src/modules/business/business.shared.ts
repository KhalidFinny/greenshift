import type {
	BusinessDocument,
	BusinessDraft,
	BusinessDraftDocument,
	BusinessStep1Patch,
	BusinessStep2Patch,
	BusinessStep3Patch,
} from "../../contracts";
import type { draftDocuments, drafts, projectDocuments } from "../../db/schema";
import { iso } from "../../lib/format";

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

// Extensions are checked alongside the MIME type: browsers report spreadsheets inconsistently.
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

// Slot vocabulary, so an upload cannot invent a checklist entry. The LVV's own pack is filed at Sistem Registri.
export const DOCUMENT_SLOTS = [
	"tagihan",
	"beban",
	"izin",
	"lapkeu",
	"rab",
] as const;

export const STEP1_SLOTS = ["tagihan", "beban", "izin"] as const;

// The denominator the credit score and risk model use for document completeness.
export const CHECKLIST_SLOTS = [...STEP1_SLOTS] as const;

/** The client generates the draft id, so it is bounded rather than trusted. */
export const MAX_DRAFT_ID = 64;

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

// `registry` and `assessment` are the two halves of verification: register, then await the LVV.
export function pillStatus(status: string): string {
	switch (status) {
		case "registry":
			return "Register for LVV";
		case "assessment":
			return "Awaiting LVV verification";
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
	step3?: BusinessStep3Patch | null;
}

/** Scope lists are open-ended, but not unbounded: a project states a handful. */
export const SCOPE_MAX_ITEMS = 20;
export const SCOPE_ITEM_MAX = 300;

// Trimmed, blanks dropped, cut to the cap: the validator and the submit path both read the list this way.
export function scopeEntries(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((entry): entry is string => typeof entry === "string")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.slice(0, SCOPE_MAX_ITEMS);
}

// The stored payload is the client's own blocks, written through the autosave validator.
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

// Draft files are not OCR'd (that happens when submit promotes them), so this carries the size, not an OCR state.
export function draftDocumentEntry(
	row: typeof draftDocuments.$inferSelect,
): BusinessDraftDocument {
	return {
		id: row.id,
		slot: row.slot,
		fileName: row.fileName,
		sizeBytes: row.sizeBytes ?? null,
		uploadedAt: iso(row.uploadedAt),
	};
}

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
