import type {
	BusinessDocument,
	BusinessDraftDocument,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import {
	ALLOWED_DOCUMENT_EXTENSIONS,
	ALLOWED_DOCUMENT_TYPES,
	draftDocumentEntry,
	isDocumentSlot,
	MAX_DOCUMENT_BYTES,
	projectDocumentEntry,
} from "../business.shared";
import * as repository from "./documents.repository";

export type DocumentResult =
	| { outcome: "ok"; document: BusinessDraftDocument }
	| { outcome: "ok_deleted" }
	| { outcome: "not_found" }
	| { outcome: "too_large" }
	| { outcome: "unsupported" }
	| { outcome: "invalid_slot" };

/** Lowercase extension without the dot, or "" when there is none. */
function extensionOf(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/**
 * Browsers report spreadsheet types inconsistently (often as
 * `application/octet-stream`), so a file passes on either a known MIME type or
 * a known extension. Both are allowlists.
 */
function isAcceptedType(file: File): boolean {
	const extension = extensionOf(file.name);
	const byExtension = (
		ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]
	).includes(extension);
	if (byExtension) return true;
	return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}

/** Keys are namespaced per draft so a draft's files are easy to sweep. */
function documentKey(draftId: string, docId: string, fileName: string): string {
	return `business-drafts/${draftId}/${docId}/${fileName}`;
}

export async function uploadDraftDocument(
	db: GreenShiftDb,
	env: Env,
	draftId: string,
	file: File,
	slot: string,
): Promise<DocumentResult> {
	if (!isDocumentSlot(slot)) return { outcome: "invalid_slot" };
	if (file.size > MAX_DOCUMENT_BYTES) return { outcome: "too_large" };
	if (!isAcceptedType(file)) return { outcome: "unsupported" };

	const docId = `doc_${crypto.randomUUID()}`;
	const fileKey = documentKey(draftId, docId, file.name);

	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || "application/octet-stream" },
	});

	try {
		const row = await repository.insertDraftDocument(db, {
			id: docId,
			draftId,
			slot,
			fileName: file.name,
			fileKey,
			contentType: file.type || null,
			sizeBytes: file.size,
		});
		return { outcome: "ok", document: draftDocumentEntry(row) };
	} catch (err) {
		// The row is the source of truth: a stored object with no row would be
		// unreachable, so take it back out rather than leaving it behind.
		await env.R2.delete(fileKey);
		throw err;
	}
}

export async function deleteDraftDocument(
	db: GreenShiftDb,
	env: Env,
	draftId: string,
	docId: string,
): Promise<DocumentResult> {
	const row = await repository.deleteDraftDocument(db, docId, draftId);
	if (!row) return { outcome: "not_found" };

	await env.R2.delete(row.fileKey);
	return { outcome: "ok_deleted" };
}

export async function listProjectDocuments(
	db: GreenShiftDb,
	projectId: number,
): Promise<BusinessDocument[]> {
	const rows = await repository.listProjectDocuments(db, projectId);
	return rows.map((row) => projectDocumentEntry(row, projectId));
}

/**
 * The stored object for a project document, ready to stream. Refuses while OCR
 * is still running, because the file is not readable yet at that point.
 */
export type ProjectDocumentStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" }
	| { outcome: "not_ready" };

export async function readProjectDocument(
	db: GreenShiftDb,
	env: Env,
	projectId: number,
	docId: number,
): Promise<ProjectDocumentStream> {
	const row = await repository.findProjectDocument(db, projectId, docId);
	if (!row?.fileUrl) return { outcome: "not_found" };
	if (row.ocrStatus === "pending" || row.ocrStatus === "processing") {
		return { outcome: "not_ready" };
	}

	const object = await env.R2.get(row.fileUrl);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
		fileName: row.fileName,
	};
}
