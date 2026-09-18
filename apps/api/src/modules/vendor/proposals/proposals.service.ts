import type { ProposalDetail, ProposalSummary } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals } from "../../../db/schema";
import { iso } from "../../../lib/format";
import {
	getProposalDetail,
	recordAudit,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./proposals.repository";

function proposalSummary(
	p: typeof proposals.$inferSelect,
	project: { id: number; title: string },
	tender: { status: string; deadlineAt: Date | null },
): ProposalSummary {
	return {
		id: p.id,
		tenderId: p.tenderId,
		projectId: project.id,
		projectTitle: project.title,
		amount: p.amount,
		status: p.status,
		revisionCount: p.revisionCount ?? 0,
		submittedAt: iso(p.submittedAt),
		tenderStatus: tender.status,
		tenderDeadlineAt: iso(tender.deadlineAt),
	};
}

// ── proposals ─────────────────────────────────────────────
export async function listVendorProposals(
	db: GreenShiftDb,
	userId: number,
	limit: number,
): Promise<ProposalSummary[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listProposalRows(db, vendorId, limit);

	return rows.map(({ proposal, tender, project }) =>
		proposalSummary(proposal, project, tender),
	);
}

export async function getVendorProposal(
	db: GreenShiftDb,
	userId: number,
	proposalId: number,
): Promise<ProposalDetail | null> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return null;

	return getProposalDetail(db, proposalId, vendorId);
}

export interface SubmitProposalInput {
	tenderId: number;
	amount: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
}

export type SubmitProposalResult =
	| { status: "ok"; proposal: ProposalSummary }
	| { status: "no_profile" }
	| { status: "unverified" }
	| { status: "tender_not_found" }
	| { status: "tender_closed" }
	| { status: "deadline_passed" }
	| { status: "duplicate" }
	| { status: "conflict" }
	| { status: "load_failed" };

export async function submitProposal(
	db: GreenShiftDb,
	userId: number,
	input: SubmitProposalInput,
): Promise<SubmitProposalResult> {
	const profile = await repository.findVendorByUser(db, userId);
	if (!profile) return { status: "no_profile" };
	if (!profile.verifiedAt) return { status: "unverified" };

	const tender = await repository.findTenderById(db, input.tenderId);
	if (!tender) return { status: "tender_not_found" };
	if (tender.status !== "open") return { status: "tender_closed" };
	if (tender.deadlineAt && tender.deadlineAt.getTime() < Date.now()) {
		return { status: "deadline_passed" };
	}

	const duplicate = await repository.findProposalIdByTenderVendor(
		db,
		input.tenderId,
		profile.id,
	);
	if (duplicate) return { status: "duplicate" };

	const inserted = await repository.insertProposalAtomically(db, {
		tenderId: input.tenderId,
		vendorId: profile.id,
		amount: input.amount,
		technicalSpec: input.technicalSpec,
		operationalCost: input.operationalCost,
		projectedRoi: input.projectedRoi,
		warrantyPeriod: input.warrantyPeriod,
	});
	if (!inserted) return { status: "conflict" };

	await recordAudit(db, {
		userId,
		projectId: tender.projectId,
		action: "proposal.submitted",
		entityType: "proposal",
		entityId: inserted.id,
		metadata: { amount: input.amount, tenderId: input.tenderId },
	});

	const row = await repository.findProposalSummaryRow(db, inserted.id);
	if (!row) return { status: "load_failed" };

	return {
		status: "ok",
		proposal: proposalSummary(row.proposal, row.project, row.tender),
	};
}

export type WithdrawProposalResult =
	| { status: "ok" }
	| { status: "not_found" }
	| { status: "locked" };

// Withdraw: allowed only while the proposal is still queued for review.
export async function withdrawVendorProposal(
	db: GreenShiftDb,
	userId: number,
	proposalId: number,
): Promise<WithdrawProposalResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const row = await repository.findProposalWithTender(db, proposalId, vendorId);
	if (!row) return { status: "not_found" };

	if (row.proposal.status !== "submitted") return { status: "locked" };

	await repository.withdrawProposalWithAudit(db, {
		proposalId,
		userId,
		projectId: row.tender.projectId,
		amount: row.proposal.amount,
	});
	return { status: "ok" };
}
