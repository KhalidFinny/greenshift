import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { vendorPortfolioItems } from "../../../db/schema";

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
		.returning({ id: vendorPortfolioItems.id });

	return deleted;
}
