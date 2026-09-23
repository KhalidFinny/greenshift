// The tender lifecycle: opening it, closing bidding, and awarding one bid.

import type { BusinessMatchmakingMethod } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals, tenders } from "../../../db/schema";
import * as bids from "./bid.repository";
import * as repository from "./procurement.repository";

type TenderRow = typeof tenders.$inferSelect;
type ProposalRow = typeof proposals.$inferSelect;

/** A tender runs for at most this long; a deadline further out is a typo. */
const MAX_TENDER_DAYS = 90;

export type TenderResult =
	| { outcome: "ok"; tender: TenderRow }
	| { outcome: "tender_locked"; status: string }
	| { outcome: "deadline_invalid" };

// One project runs one tender at a time, and once evaluation begins the terms are frozen: bids were made on them.
export async function openTender(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	choice: {
		method: BusinessMatchmakingMethod;
		deadlineAt: Date;
		budgetMin: number | null;
		budgetMax: number | null;
	},
): Promise<TenderResult> {
	const now = Date.now();
	const limit = now + MAX_TENDER_DAYS * 24 * 60 * 60 * 1000;
	if (
		choice.deadlineAt.getTime() <= now ||
		choice.deadlineAt.getTime() > limit
	) {
		return { outcome: "deadline_invalid" };
	}

	const existing = await repository.findCompanyTender(db, companyId, projectId);
	if (existing && existing.status !== "open") {
		return { outcome: "tender_locked", status: existing.status };
	}

	const terms = {
		method: choice.method,
		deadlineAt: choice.deadlineAt,
		budgetMin: choice.budgetMin,
		budgetMax: choice.budgetMax,
	};

	const tender = existing
		? await repository.updateOpenTender(db, existing.id, terms)
		: await repository.insertTender(db, {
				projectId,
				status: "open",
				...terms,
			});

	if (!tender)
		return { outcome: "tender_locked", status: existing?.status ?? "open" };

	await repository.setProjectStatus(db, projectId, "tendering");

	return { outcome: "ok", tender };
}

/** Closes bidding and puts the tender into evaluation: no new bids from here. */
export async function closeBidding(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<
	| { outcome: "ok"; tender: TenderRow }
	| { outcome: "not_found" }
	| { outcome: "not_open" }
> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return { outcome: "not_found" };
	if (tender.status !== "open") return { outcome: "not_open" };

	const updated = await repository.updateTenderStatus(
		db,
		tender.id,
		"evaluation",
	);
	return updated ? { outcome: "ok", tender: updated } : { outcome: "not_open" };
}

export type AwardResult =
	| { outcome: "ok"; tender: TenderRow; proposal: ProposalRow }
	| { outcome: "not_found" }
	| { outcome: "already_awarded" }
	| { outcome: "tender_open" }
	| { outcome: "revision_open" };

// Deciding closes every round: `AGREED` on the winner and `LOCKED` on the rest.
export async function awardBid(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	proposalId: number,
): Promise<AwardResult> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return { outcome: "not_found" };
	if (tender.status === "awarded") return { outcome: "already_awarded" };
	if (tender.status === "open") return { outcome: "tender_open" };

	const bid = await bids.findBid(db, tender.id, proposalId);
	if (!bid) return { outcome: "not_found" };

	const pending = await bids.findPendingNegotiation(db, proposalId);
	if (pending) return { outcome: "revision_open" };

	const others = await bids.listTenderBids(db, tender.id);
	for (const row of others) {
		if (row.proposal.id === proposalId) continue;
		await bids.setProposalStatus(db, row.proposal.id, "rejected");
		await bids.closeNegotiations(db, row.proposal.id, "LOCKED");
	}
	await bids.setProposalStatus(db, proposalId, "accepted");
	await bids.closeNegotiations(db, proposalId, "AGREED");

	const updated = await repository.updateTenderStatus(
		db,
		tender.id,
		"awarded",
		{
			awardedProposalId: proposalId,
		},
	);
	if (!updated) return { outcome: "not_found" };

	const awarded = await bids.findBid(db, tender.id, proposalId);
	if (!awarded) return { outcome: "not_found" };
	return { outcome: "ok", tender: updated, proposal: awarded.proposal };
}
