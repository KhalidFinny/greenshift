// The bids on a company's tenders, and the revision rounds hanging off them.

import { and, eq, inArray } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	type NegotiationStatus,
	negotiations,
	proposals,
	vendorAssignments,
	vendors,
} from "../../../db/schema";

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

// Every revision round on the given bids, oldest first, read in one query.
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

// A bid with an open round is not one to accept: its terms are not settled yet.
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

// Closes every round on a decided bid: `AGREED` for the one taken, `LOCKED` otherwise.
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
