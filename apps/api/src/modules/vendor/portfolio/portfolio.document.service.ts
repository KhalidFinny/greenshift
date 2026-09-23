import type { VendorPortfolioItem } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import * as repository from "./portfolio.repository";

/** A supporting document is an upload, not a dataset: 10 MB is generous. */
export const MAX_PORTFOLIO_DOCUMENT_BYTES = 10 * 1024 * 1024;

// Extensions are checked alongside the MIME type: browsers report Word files as octet-stream.
const ALLOWED_DOCUMENT_EXTENSIONS: readonly string[] = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
	"webp",
	"doc",
	"docx",
];

const ALLOWED_DOCUMENT_TYPES: readonly string[] = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Lowercase extension without the dot, or "" when there is none. */
function extensionOf(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function isAcceptedType(file: File): boolean {
	if (ALLOWED_DOCUMENT_EXTENSIONS.includes(extensionOf(file.name))) return true;
	return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}

/** Keys are namespaced per vendor and item, so a record's file is easy to sweep. */
function documentKey(
	vendorId: number,
	itemId: number,
	fileName: string,
): string {
	return `vendor-portfolio/${vendorId}/${itemId}/${fileName}`;
}

export type AttachDocumentResult =
	| { status: "ok"; item: VendorPortfolioItem }
	| { status: "not_found" }
	| { status: "too_large" }
	| { status: "unsupported" };

/** Files the document on one of the vendor's own records; the object lands first and goes again if the row write fails. */
export async function attachVendorPortfolioDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	id: number,
	file: File,
): Promise<AttachDocumentResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	if (file.size > MAX_PORTFOLIO_DOCUMENT_BYTES) return { status: "too_large" };
	if (!isAcceptedType(file)) return { status: "unsupported" };

	const existing = await repository.findPortfolioItem(db, id, vendorId);
	if (!existing) return { status: "not_found" };

	const fileKey = documentKey(vendorId, id, file.name);
	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || "application/octet-stream" },
	});

	const updated = await repository.setPortfolioDocument(db, id, vendorId, {
		documentName: file.name,
		documentKey: fileKey,
		documentType: file.type || null,
	});
	if (!updated) {
		await env.R2.delete(fileKey);
		return { status: "not_found" };
	}

	// Replacing a document leaves the old object behind otherwise.
	if (existing.documentKey && existing.documentKey !== fileKey) {
		await env.R2.delete(existing.documentKey);
	}

	await recordAudit(db, {
		userId,
		action: "vendor.portfolio.document",
		entityType: "vendor_portfolio_item",
		entityId: id,
	});

	return { status: "ok", item: repository.toPortfolioItem(updated) };
}

export type PortfolioDocumentStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" };

/** The filed document for one of the vendor's own records, ready to stream. */
export async function readVendorPortfolioDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	id: number,
): Promise<PortfolioDocumentStream> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { outcome: "not_found" };

	const row = await repository.findPortfolioItem(db, id, vendorId);
	if (!row?.documentKey) return { outcome: "not_found" };

	const object = await env.R2.get(row.documentKey);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType:
			object.httpMetadata?.contentType ??
			row.documentType ??
			"application/octet-stream",
		fileName: row.documentName ?? "document",
	};
}
