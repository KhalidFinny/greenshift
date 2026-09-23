// The tender and its bids as the company's project screen reads them.

import type {
	BusinessBidNegotiation,
	BusinessProcurementBid,
	BusinessTender,
	BusinessTenderStatus,
} from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { negotiations, proposals, tenders } from "../../../db/schema";
import { readAnnotations } from "../../../lib/annotations";
import * as bids from "./bid.repository";
import * as repository from "./procurement.repository";

export type { ReviewResult } from "./bid-review.service";
export { reviewBid } from "./bid-review.service";
export type { AwardResult, TenderResult } from "./tender.service";
export { awardBid, closeBidding, openTender } from "./tender.service";

type TenderRow = typeof tenders.$inferSelect;
type ProposalRow = typeof proposals.$inferSelect;
type NegotiationRow = typeof negotiations.$inferSelect;

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

/** The tender plus every bid on it, for the project screen. Scoped to its owner. */
export async function readTender(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<{ tender: BusinessTender; bids: BusinessProcurementBid[] } | null> {
	const tender = await repository.findCompanyTender(db, companyId, projectId);
	if (!tender) return null;

	const rows = await bids.listTenderBids(db, tender.id);
	// Grouped once here rather than queried per bid: a per-row query would be one round trip per vendor.
	const threads = await bids.listNegotiationsForProposals(
		db,
		rows.map((row) => row.proposal.id),
	);
	const byProposal = new Map<number, NegotiationRow[]>();
	for (const row of threads) {
		const thread = byProposal.get(row.proposalId) ?? [];
		thread.push(row);
		byProposal.set(row.proposalId, thread);
	}
	const readBids = rows.map((row) =>
		toBid(
			row.proposal,
			row.vendorName,
			projectId,
			byProposal.get(row.proposal.id) ?? [],
		),
	);
	const awarded =
		readBids.find((bid) => bid.id === tender.awardedProposalId) ?? null;

	return {
		tender: toTender(tender, {
			bidCount: readBids.length,
			awardedVendorName: awarded?.vendorName ?? null,
		}),
		bids: readBids,
	};
}
