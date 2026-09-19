import { and, eq, inArray } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { draftDocuments, drafts } from "../../../db/schema";

/**
 * The company's own draft. Scoping the lookup to the company makes another
 * company's id indistinguishable from one that does not exist, so a cross
 * company read can only ever answer "not found".
 */
export async function findDraft(
	db: GreenShiftDb,
	draftId: string,
	companyId: number,
) {
	const [row] = await db
		.select()
		.from(drafts)
		.where(and(eq(drafts.id, draftId), eq(drafts.companyId, companyId)))
		.limit(1);

	return row;
}

/** True when the id exists at all, which is how a cross-company write is caught. */
export async function draftIdExists(
	db: GreenShiftDb,
	draftId: string,
): Promise<boolean> {
	const [row] = await db
		.select({ id: drafts.id })
		.from(drafts)
		.where(eq(drafts.id, draftId))
		.limit(1);

	return row !== undefined;
}

/**
 * Creates the draft on first save and merges on every later one. One statement,
 * so two autosaves racing cannot both try to insert.
 */
export async function upsertDraft(
	db: GreenShiftDb,
	params: {
		id: string;
		companyId: number;
		payload: Record<string, unknown>;
		step: number;
	},
) {
	const [row] = await db
		.insert(drafts)
		.values({
			id: params.id,
			companyId: params.companyId,
			payload: params.payload,
			step: params.step,
		})
		.onConflictDoUpdate({
			target: drafts.id,
			set: {
				payload: params.payload,
				step: params.step,
				updatedAt: new Date(),
			},
		})
		.returning();

	return row;
}

export async function listDraftDocuments(db: GreenShiftDb, draftId: string) {
	return db
		.select()
		.from(draftDocuments)
		.where(eq(draftDocuments.draftId, draftId))
		.orderBy(draftDocuments.uploadedAt);
}

/** How many of the given ids actually belong to this draft. */
export async function countOwnedDocuments(
	db: GreenShiftDb,
	draftId: string,
	ids: string[],
): Promise<number> {
	if (ids.length === 0) return 0;
	const rows = await db
		.select({ id: draftDocuments.id })
		.from(draftDocuments)
		.where(
			and(eq(draftDocuments.draftId, draftId), inArray(draftDocuments.id, ids)),
		);

	return rows.length;
}

export async function findDraftDocument(
	db: GreenShiftDb,
	docId: string,
	draftId: string,
) {
	const [row] = await db
		.select()
		.from(draftDocuments)
		.where(
			and(eq(draftDocuments.id, docId), eq(draftDocuments.draftId, draftId)),
		)
		.limit(1);

	return row;
}
