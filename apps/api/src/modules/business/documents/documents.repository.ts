import { and, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { draftDocuments, projectDocuments } from "../../../db/schema";

export async function insertDraftDocument(
	db: GreenShiftDb,
	values: {
		id: string;
		draftId: string;
		slot: string;
		fileName: string;
		fileKey: string;
		contentType: string | null;
		sizeBytes: number;
	},
) {
	const [row] = await db.insert(draftDocuments).values(values).returning();
	return row;
}

/** Scoped to the draft, so another draft's document cannot be deleted. */
export async function deleteDraftDocument(
	db: GreenShiftDb,
	docId: string,
	draftId: string,
) {
	const [row] = await db
		.delete(draftDocuments)
		.where(
			and(eq(draftDocuments.id, docId), eq(draftDocuments.draftId, draftId)),
		)
		.returning();

	return row;
}

export async function listProjectDocuments(
	db: GreenShiftDb,
	projectId: number,
) {
	return db
		.select()
		.from(projectDocuments)
		.where(eq(projectDocuments.projectId, projectId))
		.orderBy(projectDocuments.uploadedAt);
}

export async function findProjectDocument(
	db: GreenShiftDb,
	projectId: number,
	docId: number,
) {
	const [row] = await db
		.select()
		.from(projectDocuments)
		.where(
			and(
				eq(projectDocuments.projectId, projectId),
				eq(projectDocuments.id, docId),
			),
		)
		.limit(1);

	return row;
}

// Moves a draft's files onto the project it became, as one batch, so a project is never half-documented.
export async function promoteDraftDocuments(
	db: GreenShiftDb,
	draftId: string,
	projectId: number,
) {
	const files = await db
		.select()
		.from(draftDocuments)
		.where(eq(draftDocuments.draftId, draftId));

	if (files.length === 0) return;

	await db.batch([
		db.insert(projectDocuments).values(
			files.map((file) => ({
				projectId,
				type: file.slot,
				fileName: file.fileName,
				fileUrl: file.fileKey,
				ocrStatus: "pending" as const,
			})),
		),
		db.delete(draftDocuments).where(eq(draftDocuments.draftId, draftId)),
	]);
}
