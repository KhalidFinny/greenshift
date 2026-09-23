import type {
	VendorPortfolioBody,
	VendorPortfolioItem,
} from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { vendorPortfolioItems } from "../../../db/schema";
import type { Env } from "../../../env";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import * as repository from "./portfolio.repository";

/** A supporting document is an upload, not a dataset: 10 MB is generous. */
export const MAX_PORTFOLIO_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * What a portfolio document may be. Extensions are checked alongside the MIME
 * type because browsers report Word files inconsistently, often as
 * `application/octet-stream`.
 */
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

function toPortfolioItem(
	row: typeof vendorPortfolioItems.$inferSelect,
): VendorPortfolioItem {
	return {
		id: row.id,
		projectName: row.projectName,
		clientName: row.clientName,
		projectType: row.projectType,
		location: row.location,
		description: row.description,
		projectValue: row.projectValue,
		durationMonths: row.durationMonths,
		servicesProvided: row.servicesProvided,
		energySavingPercent: row.energySavingPercent,
		carbonReductionTons: row.carbonReductionTons,
		completionYear: row.completionYear,
		documentName: row.documentName,
		documentUrl: row.documentKey
			? apiRoutes.vendorPortfolioDocumentFile.path.replace(
					":id",
					String(row.id),
				)
			: null,
	};
}

// Vendor-owned profile picture: past projects the vendor completed.
export async function listVendorPortfolio(
	db: GreenShiftDb,
	userId: number,
): Promise<VendorPortfolioItem[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listPortfolioItems(db, vendorId);
	return rows.map(toPortfolioItem);
}

export interface PortfolioItemInput {
	projectName: string;
	clientName: string;
	projectValue: number;
	details: VendorPortfolioBody | null;
}

export type AddPortfolioItemResult =
	| { status: "ok"; item: VendorPortfolioItem }
	| { status: "no_profile" }
	| { status: "insert_failed" };

export async function addVendorPortfolioItem(
	db: GreenShiftDb,
	userId: number,
	input: PortfolioItemInput,
): Promise<AddPortfolioItemResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "no_profile" };

	const details = input.details;
	const inserted = await repository.insertPortfolioItem(db, {
		vendorId,
		projectName: input.projectName,
		clientName: input.clientName,
		projectType: details?.projectType ?? null,
		location: details?.location ?? null,
		description: details?.description ?? null,
		projectValue: input.projectValue,
		durationMonths: details?.durationMonths ?? null,
		servicesProvided: details?.servicesProvided ?? null,
		energySavingPercent: details?.energySavingPercent ?? null,
		carbonReductionTons: details?.carbonReductionTons ?? null,
		completionYear: details?.completionYear ?? null,
	});
	if (!inserted) return { status: "insert_failed" };

	await recordAudit(db, {
		userId,
		action: "vendor.portfolio.created",
		entityType: "vendor_portfolio_item",
		entityId: inserted.id,
	});

	return { status: "ok", item: toPortfolioItem(inserted) };
}

export type DeletePortfolioItemResult =
	| { status: "ok" }
	| { status: "not_found" };

export async function removeVendorPortfolioItem(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	id: number,
): Promise<DeletePortfolioItemResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const deleted = await repository.deletePortfolioItem(db, id, vendorId);
	if (!deleted) return { status: "not_found" };

	// The row is the source of truth: an object left behind with no row is
	// unreachable, so the file goes with it.
	if (deleted.documentKey) await env.R2.delete(deleted.documentKey);

	await recordAudit(db, {
		userId,
		action: "vendor.portfolio.deleted",
		entityType: "vendor_portfolio_item",
		entityId: deleted.id,
	});

	return { status: "ok" };
}

export type AttachDocumentResult =
	| { status: "ok"; item: VendorPortfolioItem }
	| { status: "not_found" }
	| { status: "too_large" }
	| { status: "unsupported" };

/**
 * Files the supporting document on one of the vendor's own records. The row is
 * written first and the object after it, so a failed write leaves the previous
 * document in place rather than a key pointing at nothing.
 */
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

	return { status: "ok", item: toPortfolioItem(updated) };
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
