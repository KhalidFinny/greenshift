import type {
	BusinessMatchmakingMethod,
	BusinessProcurementBid,
	BusinessTender,
	BusinessTenderStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals, tenders } from "../../../db/schema";
import { maxNegotiationIterations } from "../../../db/schema";
import { scoreBids } from "../matchmaking/bid-score.service";
import * as repository from "./procurement.repository";

type TenderRow = typeof tenders.$inferSelect;
type ProposalRow = typeof proposals.$inferSelect;

/** A tender runs for at most this long; a deadline further out is a typo. */
const MAX_TENDER_DAYS = 90;

function iso(value: Date | null): string | null {
	return value ? value.toISOString() : null;
}

export function toTender(
	tender: TenderRow,
	extra: { bidCount: number; awardedVendorName: string | null },
): BusinessTender {
	return {
		id: tender.id,
		projectId: tender.projectId,
		method: tender.method,
		status: tender.status as BusinessTenderStatus,
		deadlineAt: iso(tender.deadlineAt),
		budgetMin: tender.budgetMin,
		budgetMax: tender.budgetMax,
		awardedProposalId: tender.awardedProposalId ?? null,
		bidCount: extra.bidCount,
		awardedVendorName: extra.awardedVendorName,
	};
}

function toBid(
	proposal: ProposalRow,
	vendorName: string,
): BusinessProcurementBid {
	return {
		// Filled in by the read, which sees every bid on the tender at once.
		score: null,
		id: proposal.id,
		vendorId: proposal.vendorId,
		vendorName,
		amount: proposal.amount,
		technicalSpec: proposal.technicalSpec,
		operationalCost: proposal.operationalCost,
		projectedRoi: proposal.projectedRoi,
		warrantyPeriod: proposal.warrantyPeriod,
		status: proposal.status,
		revisionCount: proposal.revisionCount ?? 0,
		submittedAt: iso(proposal.submittedAt),
	};
}

export type TenderResult =
	| { outcome: "ok"; tender: TenderRow }
	| { outcome: "tender_locked"; status: string }
	| { outcome: "deadline_invalid" };

/**
 * Starts, or re-shapes, the tender the company's choice implies. One project
 * runs one tender at a time; while it is open the company may still move the
 * deadline, but once evaluation has begun the terms are frozen — the bids were
 * made against them.
 */
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

	// The project is in its tendering phase from here on, which is what the
	// company's list and the vendor's market both read.
	await repository.setProjectStatus(db, projectId, "tendering");

	return { outcome: "ok", tender };
}

/** The tender plus every bid on it, for the project screen. Scoped to its owner. */
export async function readTender(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<{ tender: BusinessTender; bids: BusinessProcurementBid[] } | null> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return null;

	const rows = await repository.listTenderBids(db, tender.id);
	const bids = scoreBids(
		rows.map((row) => toBid(row.proposal, row.vendorName)),
	).map((scored) => ({ ...scored.bid, score: scored.score }));
	const awarded =
		bids.find((bid) => bid.id === tender.awardedProposalId) ?? null;

	return {
		tender: toTender(tender, {
			bidCount: bids.length,
			awardedVendorName: awarded?.vendorName ?? null,
		}),
		bids,
	};
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
	| { outcome: "tender_open" };

/**
 * Awards the tender to one bid. Appointment and contract are separate steps in
 * this flow, so the losing bids are marked rejected while the winner stays
 * `accepted` for the contract to be approved next.
 */
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

	const bid = await repository.findBid(db, tender.id, proposalId);
	if (!bid) return { outcome: "not_found" };

	const others = await repository.listTenderBids(db, tender.id);
	for (const row of others) {
		if (row.proposal.id === proposalId) continue;
		await repository.setProposalStatus(db, row.proposal.id, "rejected");
	}
	await repository.setProposalStatus(db, proposalId, "accepted");

	const updated = await repository.updateTenderStatus(
		db,
		tender.id,
		"awarded",
		{
			awardedProposalId: proposalId,
		},
	);
	if (!updated) return { outcome: "not_found" };

	const awarded = await repository.findBid(db, tender.id, proposalId);
	return { outcome: "ok", tender: updated, proposal: awarded!.proposal };
}

export type ReviewResult =
	| { outcome: "ok"; proposal: ProposalRow; iteration: number | null }
	| { outcome: "not_found" }
	| { outcome: "revision_note_required" }
	| { outcome: "revision_limit_reached" };

/**
 * The company's verdict on one bid: accept it, or ask for a revision. Asking
 * opens a negotiation iteration carrying the company's note, which is what the
 * vendor's Revisi & Negosiasi tab reads; the vendor answers it and the revision
 * count only advances when they resubmit. The 3-iteration cap is the same
 * constant the vendor's update path enforces.
 */
export async function reviewBid(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	proposalId: number,
	review: { decision: "accept" | "revision" | "reject"; note: string | null },
): Promise<ReviewResult> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return { outcome: "not_found" };

	const bid = await repository.findBid(db, tender.id, proposalId);
	if (!bid) return { outcome: "not_found" };

	if (review.decision === "accept") {
		const updated = await repository.setProposalStatus(
			db,
			proposalId,
			"accepted",
		);
		return {
			outcome: "ok",
			proposal: updated ?? bid.proposal,
			iteration: null,
		};
	}

	if (review.decision === "reject") {
		const updated = await repository.setProposalStatus(
			db,
			proposalId,
			"rejected",
		);
		return {
			outcome: "ok",
			proposal: updated ?? bid.proposal,
			iteration: null,
		};
	}

	if (!review.note?.trim()) return { outcome: "revision_note_required" };

	const iterations = await repository.countNegotiations(db, proposalId);
	if (iterations >= maxNegotiationIterations) {
		return { outcome: "revision_limit_reached" };
	}

	const iteration = await repository.insertNegotiation(db, {
		proposalId,
		iterationNumber: iterations + 1,
		companyNote: review.note.trim(),
	});
	const updated = await repository.setProposalStatus(
		db,
		proposalId,
		"revision",
	);

	return {
		outcome: "ok",
		proposal: updated ?? bid.proposal,
		iteration: iteration.iterationNumber,
	};
}
