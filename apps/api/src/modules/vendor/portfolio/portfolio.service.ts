import type {
	VendorPortfolioBody,
	VendorPortfolioItem,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import * as repository from "./portfolio.repository";

export {
	type AttachDocumentResult,
	attachVendorPortfolioDocument,
	MAX_PORTFOLIO_DOCUMENT_BYTES,
	type PortfolioDocumentStream,
	readVendorPortfolioDocument,
} from "./portfolio.document.service";

// Vendor-owned profile picture: past projects the vendor completed.
export async function listVendorPortfolio(
	db: GreenShiftDb,
	userId: number,
): Promise<VendorPortfolioItem[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listPortfolioItems(db, vendorId);
	return rows.map(repository.toPortfolioItem);
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

	return { status: "ok", item: repository.toPortfolioItem(inserted) };
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

	// The row is the source of truth: an object with no row is unreachable, so the file goes with it.
	if (deleted.documentKey) await env.R2.delete(deleted.documentKey);

	await recordAudit(db, {
		userId,
		action: "vendor.portfolio.deleted",
		entityType: "vendor_portfolio_item",
		entityId: deleted.id,
	});

	return { status: "ok" };
}
