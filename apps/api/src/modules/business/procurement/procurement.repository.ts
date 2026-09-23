import { and, desc, eq, inArray } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	type NegotiationStatus,
	negotiations,
	projects,
	proposals,
	tenders,
	vendorAssignments,
	vendors,
} from "../../../db/schema";

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

// The owner check is part of the query, so another company's project id reads as
// missing: nothing downstream can forget it and act on a row that was never theirs.
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

/** The bids on a tender, best amount first, with the bidding vendor named. */
export async function listTenderBids(db: GreenShiftDb, tenderId: number) {
	return db
		.select({ proposal: proposals, vendorName: vendors.companyName })
		.from(proposals)
		.innerJoin(vendors, eq(vendors.id, proposals.vendorId))
		.where(eq(proposals.tenderId, tenderId))
		.orderBy(proposals.amount, proposals.id);
}

export async function findBid(
	db: GreenShiftDb,
	tenderId: number,
	proposalId: number,
) {
	const [row] = await db
		.select({ proposal: proposals, vendorName: vendors.companyName })
		.from(proposals)
		.innerJoin(vendors, eq(vendors.id, proposals.vendorId))
		.where(and(eq(proposals.tenderId, tenderId), eq(proposals.id, proposalId)))
		.limit(1);

	return row ?? null;
}

/** The vendor the company appointed, which is what a direct tender is for. */
export async function findAssignment(db: GreenShiftDb, projectId: number) {
	const [row] = await db
		.select()
		.from(vendorAssignments)
		.where(eq(vendorAssignments.projectId, projectId))
		.limit(1);

	return row ?? null;
}

/** Names for the vendors bidding, so a bid row never shows a bare id. */
export async function vendorNamesFor(
	db: GreenShiftDb,
	vendorIds: number[],
): Promise<Map<number, string>> {
	if (vendorIds.length === 0) return new Map();
	const rows = await db
		.select({ id: vendors.id, name: vendors.companyName })
		.from(vendors)
		.where(inArray(vendors.id, vendorIds));

	return new Map(rows.map((row) => [row.id, row.name]));
}

export async function setProposalStatus(
	db: GreenShiftDb,
	proposalId: number,
	status: string,
) {
	const [row] = await db
		.update(proposals)
		.set({
			status,
			reviewedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(proposals.id, proposalId))
		.returning();

	return row ?? null;
}

export async function countNegotiations(
	db: GreenShiftDb,
	proposalId: number,
): Promise<number> {
	const rows = await db
		.select({ id: negotiations.id })
		.from(negotiations)
		.where(eq(negotiations.proposalId, proposalId));

	return rows.length;
}

// Every revision round on the given bids, oldest first, read in one query: the bidding
// screen shows each bid's thread beside it.
export async function listNegotiationsForProposals(
	db: GreenShiftDb,
	proposalIds: number[],
) {
	if (proposalIds.length === 0) return [];
	return db
		.select()
		.from(negotiations)
		.where(inArray(negotiations.proposalId, proposalIds))
		.orderBy(negotiations.iterationNumber);
}

/** Opens a revision round, carrying the company's note for the vendor. */
export async function insertNegotiation(
	db: GreenShiftDb,
	values: typeof negotiations.$inferInsert,
) {
	const [row] = await db.insert(negotiations).values(values).returning();
	return row;
}

// The revision round the vendor has not answered yet, if the bid has one. A bid in this
// state is not one to accept: the round is still open, so its terms are not settled.
export async function findPendingNegotiation(
	db: GreenShiftDb,
	proposalId: number,
) {
	const [row] = await db
		.select()
		.from(negotiations)
		.where(
			and(
				eq(negotiations.proposalId, proposalId),
				eq(negotiations.status, "PENDING_VENDOR_RESPONSE"),
			),
		)
		.limit(1);

	return row ?? null;
}

// Closes every round on a decided bid: `AGREED` for the one the company took, `LOCKED`
// otherwise. Without this a vendor's screen keeps asking about an awarded tender.
export async function closeNegotiations(
	db: GreenShiftDb,
	proposalId: number,
	status: NegotiationStatus,
) {
	await db
		.update(negotiations)
		.set({ status })
		.where(eq(negotiations.proposalId, proposalId));
}
