// The tender rows themselves: finding, shaping and advancing one project's tender.

import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { projects, tenders } from "../../../db/schema";

export type TenderRow = typeof tenders.$inferSelect;

/** The tender a project is running, if any. One project runs one at a time. */
export async function findTenderByProject(db: GreenShiftDb, projectId: number) {
	const [row] = await db
		.select()
		.from(tenders)
		.where(eq(tenders.projectId, projectId))
		.orderBy(desc(tenders.id))
		.limit(1);

	return row ?? null;
}

// The owner check is part of the query, so another company's project id reads as missing.
export async function findCompanyTender(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
) {
	const [row] = await db
		.select({ tender: tenders })
		.from(tenders)
		.innerJoin(projects, eq(projects.id, tenders.projectId))
		.where(
			and(eq(projects.companyId, companyId), eq(tenders.projectId, projectId)),
		)
		.orderBy(desc(tenders.id))
		.limit(1);

	return row?.tender ?? null;
}

export async function findTenderById(db: GreenShiftDb, id: number) {
	const [row] = await db
		.select()
		.from(tenders)
		.where(eq(tenders.id, id))
		.limit(1);
	return row ?? null;
}

export async function listTendersForCompany(
	db: GreenShiftDb,
	companyId: number,
	limit: number,
) {
	return db
		.select({ tender: tenders, project: projects })
		.from(tenders)
		.innerJoin(projects, eq(projects.id, tenders.projectId))
		.where(eq(projects.companyId, companyId))
		.orderBy(desc(tenders.createdAt), desc(tenders.id))
		.limit(limit);
}

export async function insertTender(
	db: GreenShiftDb,
	values: typeof tenders.$inferInsert,
) {
	const [row] = await db.insert(tenders).values(values).returning();
	return row;
}

/** Only an open tender may be re-shaped: the bids on it are not yet read. */
export async function updateOpenTender(
	db: GreenShiftDb,
	id: number,
	set: Partial<typeof tenders.$inferInsert>,
) {
	const [row] = await db
		.update(tenders)
		.set({ ...set, updatedAt: new Date() })
		.where(and(eq(tenders.id, id), eq(tenders.status, "open")))
		.returning();

	return row ?? null;
}

export async function updateTenderStatus(
	db: GreenShiftDb,
	id: number,
	status: (typeof tenders.$inferInsert)["status"],
	extra: Partial<typeof tenders.$inferInsert> = {},
) {
	const [row] = await db
		.update(tenders)
		.set({ ...extra, status, updatedAt: new Date() })
		.where(eq(tenders.id, id))
		.returning();

	return row ?? null;
}

export async function setProjectStatus(
	db: GreenShiftDb,
	projectId: number,
	status: (typeof projects.$inferInsert)["status"],
) {
	await db
		.update(projects)
		.set({ status, updatedAt: new Date() })
		.where(eq(projects.id, projectId));
}
