import { and, asc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	projects,
	proposals,
	tenders,
	users,
	vendors,
} from "../../../db/schema";

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

export async function listTenderProposals(db: GreenShiftDb, tenderId: number) {
	return db
		.select({
			proposalId: proposals.id,
			vendorId: proposals.vendorId,
			amount: proposals.amount,
			vendorName: users.name,
			updatedAt: proposals.updatedAt,
		})
		.from(proposals)
		.innerJoin(vendors, eq(proposals.vendorId, vendors.id))
		.innerJoin(users, eq(vendors.userId, users.id))
		.where(eq(proposals.tenderId, tenderId))
		.orderBy(asc(proposals.amount), asc(proposals.id));
}
