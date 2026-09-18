import { and, eq, lt, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	proposalRevisions,
	proposals,
	tenders,
	vendors,
} from "../../../db/schema";

export async function findVendorIdWithVerification(
	db: GreenShiftDb,
	userId: number,
) {
	const [profile] = await db
		.select({ id: vendors.id, verifiedAt: vendors.verifiedAt })
		.from(vendors)
		.where(eq(vendors.userId, userId))
		.limit(1);

	return profile;
}

export async function findProposalWithTender(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
) {
	const [row] = await db
		.select({ proposal: proposals, tender: tenders })
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.limit(1);

	return row;
}

// Atomic gate: the status + revision cap are re-checked inside the
// UPDATE ... WHERE, so concurrent responses cannot double-claim the next
// revision slot. The service's pre-check only provides nicer errors.
export async function claimRevision(
	db: GreenShiftDb,
	params: {
		proposalId: number;
		patch: Partial<typeof proposals.$inferInsert>;
		maxRevisions: number;
	},
) {
	const [claimed] = await db
		.update(proposals)
		.set({
			...params.patch,
			status: "submitted",
			revisionCount: sql`${proposals.revisionCount} + 1`,
			submittedAt: new Date(),
		})
		.where(
			and(
				eq(proposals.id, params.proposalId),
				eq(proposals.status, "revision"),
				lt(proposals.revisionCount, params.maxRevisions),
			),
		)
		.returning();

	return claimed;
}

export async function updateProposalFields(
	db: GreenShiftDb,
	proposalId: number,
	patch: Partial<typeof proposals.$inferInsert>,
) {
	const [row] = await db
		.update(proposals)
		.set(patch)
		.where(eq(proposals.id, proposalId))
		.returning();

	return row;
}

export async function insertProposalRevision(
	db: GreenShiftDb,
	values: typeof proposalRevisions.$inferInsert,
): Promise<void> {
	await db.insert(proposalRevisions).values(values);
}
