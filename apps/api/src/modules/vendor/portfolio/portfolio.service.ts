import type {
	VendorPortfolioBody,
	VendorPortfolioItem,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { vendorPortfolioItems } from "../../../db/schema";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import * as repository from "./portfolio.repository";

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
		status: row.status,
		documentName: row.documentName,
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
		status: details?.status === "VERIFIED" ? "VERIFIED" : "COMPLETED",
		documentName: details?.documentName ?? null,
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
	userId: number,
	id: number,
): Promise<DeletePortfolioItemResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const deleted = await repository.deletePortfolioItem(db, id, vendorId);
	if (!deleted) return { status: "not_found" };

	await recordAudit(db, {
		userId,
		action: "vendor.portfolio.deleted",
		entityType: "vendor_portfolio_item",
		entityId: deleted.id,
	});

	return { status: "ok" };
}
