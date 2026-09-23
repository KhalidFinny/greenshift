import { and, eq, lte } from "drizzle-orm";
import type { VendorTenderSummary } from "../../contracts";
import type { GreenShiftDb } from "../../db";
import {
	matchShortlistSize,
	tenders,
	vendorAssignments,
	vendorMatchScores,
} from "../../db/schema";
import { iso } from "../../lib/format";

export function tenderSummary(
	t: typeof tenders.$inferSelect,
): VendorTenderSummary {
	return {
		id: t.id,
		method: t.method,
		status: t.status,
		budgetMin: t.budgetMin,
		budgetMax: t.budgetMax,
		deadlineAt: iso(t.deadlineAt),
		awardedProposalId: t.awardedProposalId,
	};
}

/** Open bidding is public to every verified vendor; closed is the shortlist, direct the appointed one. */
export async function isTenderVisibleTo(
	db: GreenShiftDb,
	projectId: number,
	vendorId: number,
	method: string,
): Promise<boolean> {
	if (method === "open") return true;

	const [appointed] = await db
		.select({ id: vendorAssignments.id })
		.from(vendorAssignments)
		.where(
			and(
				eq(vendorAssignments.projectId, projectId),
				eq(vendorAssignments.vendorId, vendorId),
			),
		)
		.limit(1);
	if (appointed) return true;
	if (method === "direct") return false;

	// A closed tender invites the ranked shortlist only: being scored is not the same as being put forward.
	const [shortlisted] = await db
		.select({ id: vendorMatchScores.id })
		.from(vendorMatchScores)
		.where(
			and(
				eq(vendorMatchScores.projectId, projectId),
				eq(vendorMatchScores.vendorId, vendorId),
				lte(vendorMatchScores.rank, matchShortlistSize),
			),
		)
		.limit(1);

	return shortlisted !== undefined;
}
