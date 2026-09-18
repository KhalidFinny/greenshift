import type { VendorNegotiation } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { maxNegotiationIterations } from "../../../db/schema";
import { iso } from "../../../lib/format";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import type { NegotiationRow } from "./negotiations.repository";
import * as repository from "./negotiations.repository";

function toNegotiation(row: NegotiationRow): VendorNegotiation {
	const n = row.negotiation;
	return {
		id: n.id,
		proposalId: n.proposalId,
		projectId: row.projectId,
		projectTitle: row.projectTitle,
		companyName: row.companyName,
		iterationNumber: n.iterationNumber,
		maxIterations: maxNegotiationIterations,
		status: n.status,
		requestedPriceReduction: n.requestedPriceReduction,
		requestedWarrantyYears: n.requestedWarrantyYears,
		requestedTimelineMonths: n.requestedTimelineMonths,
		requestedFields: n.requestedFields ?? [],
		companyNote: n.companyNote,
		vendorRevisedPrice: n.vendorRevisedPrice,
		vendorRevisedWarrantyYears: n.vendorRevisedWarrantyYears,
		vendorRevisedTimelineMonths: n.vendorRevisedTimelineMonths,
		vendorResponseNote: n.vendorResponseNote,
		respondedAt: iso(n.respondedAt),
		updatedAt: n.updatedAt.toISOString(),
	};
}

// ── negotiations ──────────────────────────────────────────
export async function listVendorNegotiations(
	db: GreenShiftDb,
	userId: number,
): Promise<VendorNegotiation[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listNegotiationRows(db, vendorId);
	return rows.map(toNegotiation);
}

export interface NegotiationResponseInput {
	revisedPrice?: number;
	revisedWarrantyYears?: number;
	revisedTimelineMonths?: number;
	note?: string;
}

export type RespondToNegotiationResult =
	| { status: "ok"; negotiation: VendorNegotiation }
	| { status: "not_found" }
	| { status: "invalid_state" }
	| { status: "load_failed" };

// Answer a company revision request: stores the vendor's counter-offer on the
// negotiation, appends a vendor entry to the proposal revision trail and puts
// the proposal back in review.
export async function respondToVendorNegotiation(
	db: GreenShiftDb,
	userId: number,
	id: number,
	input: NegotiationResponseInput,
): Promise<RespondToNegotiationResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const row = await repository.findNegotiationRow(db, id, vendorId);
	if (!row) return { status: "not_found" };
	if (row.negotiation.status !== "PENDING_VENDOR_RESPONSE") {
		return { status: "invalid_state" };
	}

	const now = new Date();
	const previousAmount = row.proposal.amount;
	const nextAmount = input.revisedPrice ?? previousAmount;

	await repository.updateNegotiationResponse(db, id, {
		status: "SUBMITTED_BY_VENDOR",
		vendorRevisedPrice: input.revisedPrice ?? null,
		vendorRevisedWarrantyYears: input.revisedWarrantyYears ?? null,
		vendorRevisedTimelineMonths: input.revisedTimelineMonths ?? null,
		vendorResponseNote: input.note ?? null,
		respondedAt: now,
	});

	if (nextAmount !== previousAmount) {
		await repository.updateProposalAfterNegotiation(db, row.proposal.id, {
			amount: nextAmount,
			revisionCount: (row.proposal.revisionCount ?? 0) + 1,
		});

		await repository.insertProposalRevision(db, {
			proposalId: row.proposal.id,
			revisionNumber: (row.proposal.revisionCount ?? 0) + 1,
			note: input.note ?? null,
			amount: nextAmount,
			previousAmount,
			createdBy: "vendor",
		});
	}

	await recordAudit(db, {
		userId,
		projectId: row.projectId,
		action: "negotiation.responded",
		entityType: "negotiation",
		entityId: id,
		metadata: { revisedPrice: input.revisedPrice ?? null },
	});

	const updated = await repository.loadNegotiation(db, id);
	if (!updated) return { status: "load_failed" };

	return { status: "ok", negotiation: toNegotiation(updated) };
}
