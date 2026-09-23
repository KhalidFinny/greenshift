import { and, asc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { projects, proposals, tenders, vendors } from "../../../db/schema";

// The vendor's open-bid tender with the nearest deadline.
export async function findTargetTender(db: GreenShiftDb, vendorId: number) {
	const [target] = await db
		.select({ tender: tenders, project: projects, proposal: proposals })
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(
			and(
				eq(proposals.vendorId, vendorId),
				eq(tenders.method, "open"),
				eq(tenders.status, "open"),
			),
		)
		.orderBy(asc(tenders.deadlineAt))
		.limit(1);

	return target;
}

/**
 * One named tender, with the vendor's own proposal on it when it has one. A
 * project screen names the tender it is showing, so the standings it renders are
 * that tender's rather than whichever tender the vendor happens to be bidding on
 * elsewhere.
 */
export async function findTenderTarget(
	db: GreenShiftDb,
	tenderId: number,
	vendorId: number,
) {
	const [row] = await db
		.select({ tender: tenders, project: projects })
		.from(tenders)
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(eq(tenders.id, tenderId))
		.limit(1);
	if (!row) return null;

	const [mine] = await db
		.select({ id: proposals.id, amount: proposals.amount })
		.from(proposals)
		.where(
			and(eq(proposals.tenderId, tenderId), eq(proposals.vendorId, vendorId)),
		)
		.limit(1);

	return { tender: row.tender, project: row.project, proposal: mine ?? null };
}

export async function listTenderProposals(db: GreenShiftDb, tenderId: number) {
	return db
		.select({
			proposalId: proposals.id,
			vendorId: proposals.vendorId,
			amount: proposals.amount,
			vendorName: vendors.companyName,
			updatedAt: proposals.updatedAt,
		})
		.from(proposals)
		.innerJoin(vendors, eq(proposals.vendorId, vendors.id))
		.where(eq(proposals.tenderId, tenderId))
		.orderBy(asc(proposals.amount), asc(proposals.id));
}
