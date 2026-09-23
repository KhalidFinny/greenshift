// The company's verdict on one bid: revision or reject. Accepting a bid is the award, not a review.

import type { ProposalAnnotation } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals } from "../../../db/schema";
import { maxNegotiationIterations } from "../../../db/schema";
import * as bids from "./bid.repository";
import * as repository from "./procurement.repository";

type ProposalRow = typeof proposals.$inferSelect;

export type ReviewResult =
	| { outcome: "ok"; proposal: ProposalRow; iteration: number | null }
	| { outcome: "not_found" }
	| { outcome: "revision_note_required" }
	| { outcome: "revision_limit_reached" }
	| { outcome: "revision_pending" };

export async function reviewBid(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	proposalId: number,
	review: {
		decision: "revision" | "reject";
		note: string | null;
		annotations: ProposalAnnotation[];
	},
): Promise<ReviewResult> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return { outcome: "not_found" };

	const bid = await bids.findBid(db, tender.id, proposalId);
	if (!bid) return { outcome: "not_found" };

	if (review.decision === "reject") {
		const updated = await bids.setProposalStatus(db, proposalId, "rejected");
		// A rejected bid is decided, so its rounds close with it: nothing is waiting on the vendor.
		await bids.closeNegotiations(db, proposalId, "LOCKED");
		return {
			outcome: "ok",
			proposal: updated ?? bid.proposal,
			iteration: null,
		};
	}

	if (!review.note?.trim()) return { outcome: "revision_note_required" };

	if (await bids.findPendingNegotiation(db, proposalId)) {
		return { outcome: "revision_pending" };
	}

	const iterations = await bids.countNegotiations(db, proposalId);
	if (iterations >= maxNegotiationIterations) {
		return { outcome: "revision_limit_reached" };
	}

	const iteration = await bids.insertNegotiation(db, {
		proposalId,
		iterationNumber: iterations + 1,
		companyNote: review.note.trim(),
		annotations: review.annotations,
	});
	const updated = await bids.setProposalStatus(db, proposalId, "revision");

	return {
		outcome: "ok",
		proposal: updated ?? bid.proposal,
		iteration: iteration.iterationNumber,
	};
}
