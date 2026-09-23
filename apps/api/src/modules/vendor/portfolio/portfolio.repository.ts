import { and, desc, eq } from "drizzle-orm";
import type { VendorPortfolioItem } from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { vendorPortfolioItems } from "../../../db/schema";

export function toPortfolioItem(
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

export async function listPortfolioItems(db: GreenShiftDb, vendorId: number) {
	return db
		.select()
		.from(vendorPortfolioItems)
		.where(eq(vendorPortfolioItems.vendorId, vendorId))
		.orderBy(
			desc(vendorPortfolioItems.completionYear),
			desc(vendorPortfolioItems.id),
		);
}

export async function insertPortfolioItem(
	db: GreenShiftDb,
	values: typeof vendorPortfolioItems.$inferInsert,
) {
	const [inserted] = await db
		.insert(vendorPortfolioItems)
		.values(values)
		.returning();

	return inserted;
}

/** One of the vendor's own records, or null when the id is not theirs. */
export async function findPortfolioItem(
	db: GreenShiftDb,
	id: number,
	vendorId: number,
) {
	const [row] = await db
		.select()
		.from(vendorPortfolioItems)
		.where(
			and(
				eq(vendorPortfolioItems.id, id),
				eq(vendorPortfolioItems.vendorId, vendorId),
			),
		)
		.limit(1);

	return row ?? null;
}

export async function setPortfolioDocument(
	db: GreenShiftDb,
	id: number,
	vendorId: number,
	values: {
		documentName: string;
		documentKey: string;
		documentType: string | null;
	},
) {
	const [row] = await db
		.update(vendorPortfolioItems)
		.set(values)
		.where(
			and(
				eq(vendorPortfolioItems.id, id),
				eq(vendorPortfolioItems.vendorId, vendorId),
			),
		)
		.returning();

	return row ?? null;
}

export async function deletePortfolioItem(
	db: GreenShiftDb,
	id: number,
	vendorId: number,
) {
	const [deleted] = await db
		.delete(vendorPortfolioItems)
		.where(
			and(
				eq(vendorPortfolioItems.id, id),
				eq(vendorPortfolioItems.vendorId, vendorId),
			),
		)
		.returning({
			id: vendorPortfolioItems.id,
			documentKey: vendorPortfolioItems.documentKey,
		});

	return deleted;
}
