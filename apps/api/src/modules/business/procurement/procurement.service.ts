import type {
	BusinessBidNegotiation,
	BusinessMatchmakingMethod,
	BusinessProcurementBid,
	BusinessTender,
	BusinessTenderStatus,
	ProposalAnnotation,
} from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { negotiations, proposals, tenders } from "../../../db/schema";
import { maxNegotiationIterations } from "../../../db/schema";
import { readAnnotations } from "../../../lib/annotations";
import * as repository from "./procurement.repository";

type TenderRow = typeof tenders.$inferSelect;
type ProposalRow = typeof proposals.$inferSelect;
type NegotiationRow = typeof negotiations.$inferSelect;

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

function toNegotiation(row: NegotiationRow): BusinessBidNegotiation {
	return {
		id: row.id,
		iterationNumber: row.iterationNumber,
		status: row.status,
		companyNote: row.companyNote,
		annotations: readAnnotations(row.annotations),
		requestedFields: (row.requestedFields as string[] | null) ?? [],
		vendorRevisedPrice: row.vendorRevisedPrice,
		vendorRevisedWarrantyYears: row.vendorRevisedWarrantyYears,
		vendorResponseNote: row.vendorResponseNote,
		respondedAt: iso(row.respondedAt),
		createdAt: row.createdAt.toISOString(),
	};
}

function toBid(
	proposal: ProposalRow,
	vendorName: string,
	projectId: number,
	negotiations: NegotiationRow[],
): BusinessProcurementBid {
	return {
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
		documentName: proposal.documentName,
		documentUrl: proposal.documentKey
			? apiRoutes.businessBidDocument.path
					.replace(":projectId", String(projectId))
					.replace(":proposalId", String(proposal.id))
			: null,
		negotiations: negotiations.map(toNegotiation),
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
	const threads = await repository.listNegotiationsForProposals(
		db,
		rows.map((row) => row.proposal.id),
	);
	// Grouped once here rather than queried per bid: the screen reads one tender,
	// and a per-row query would be one round trip per vendor.
	const byProposal = new Map<number, NegotiationRow[]>();
	for (const row of threads) {
		const thread = byProposal.get(row.proposalId) ?? [];
		thread.push(row);
		byProposal.set(row.proposalId, thread);
	}
	const bids = rows.map((row) =>
		toBid(
			row.proposal,
			row.vendorName,
			projectId,
			byProposal.get(row.proposal.id) ?? [],
		),
	);
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
	| { outcome: "tender_open" }
	| { outcome: "revision_open" };

/**
 * Awards the tender to one bid. Appointment and contract are separate steps in
 * this flow, so the losing bids are marked rejected while the winner stays
 * `accepted` for the contract to be approved next.
 *
 * A bid is only a bid once every revision round on it is done: awarding one the
 * vendor is still revising would accept terms neither side has settled, so it
 * is refused until the vendor answers or the company rejects the bid. Deciding
 * the tender closes the rounds either way: `AGREED` on the winner, `LOCKED` on
 * every bid it turned down.
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

	const pending = await repository.findPendingNegotiation(db, proposalId);
	if (pending) return { outcome: "revision_open" };

	const others = await repository.listTenderBids(db, tender.id);
	for (const row of others) {
		if (row.proposal.id === proposalId) continue;
		await repository.setProposalStatus(db, row.proposal.id, "rejected");
		await repository.closeNegotiations(db, row.proposal.id, "LOCKED");
	}
	await repository.setProposalStatus(db, proposalId, "accepted");
	await repository.closeNegotiations(db, proposalId, "AGREED");

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
	| { outcome: "revision_limit_reached" }
	| { outcome: "revision_pending" };

/**
 * The company's verdict on one bid: ask for a revision, or reject it. Accepting
 * is not a separate act: it is the award, which accepts the winning bid and
 * rejects the rest, so there is one place the company decides who carries the
 * work rather than two that can disagree.
 *
 * Asking for a revision opens a negotiation iteration carrying the company's
 * note and the marks it drew on the proposal, which is what the vendor's
 * Revisi & Negosiasi tab reads; the vendor answers it and the revision count
 * only advances when they resubmit. The 3-iteration cap is the same constant
 * the vendor's update path enforces, and a round that is still open blocks the
 * next verdict: the bid is mid-revision until the vendor answers it.
 */
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

	const bid = await repository.findBid(db, tender.id, proposalId);
	if (!bid) return { outcome: "not_found" };

	if (review.decision === "reject") {
		const updated = await repository.setProposalStatus(
			db,
			proposalId,
			"rejected",
		);
		// The bid is decided, so its rounds close with it: nothing on a rejected
		// bid is waiting on the vendor any more.
		await repository.closeNegotiations(db, proposalId, "LOCKED");
		return {
			outcome: "ok",
			proposal: updated ?? bid.proposal,
			iteration: null,
		};
	}

	if (!review.note?.trim()) return { outcome: "revision_note_required" };

	if (await repository.findPendingNegotiation(db, proposalId)) {
		return { outcome: "revision_pending" };
	}

	const iterations = await repository.countNegotiations(db, proposalId);
	if (iterations >= maxNegotiationIterations) {
		return { outcome: "revision_limit_reached" };
	}

	const iteration = await repository.insertNegotiation(db, {
		proposalId,
		iterationNumber: iterations + 1,
		companyNote: review.note.trim(),
		annotations: review.annotations,
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
