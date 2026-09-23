import type { ProposalSummary } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { proposalSummary } from "../vendor.proposal";
import {
	isTenderVisibleTo,
	recordAudit,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./proposals.repository";
import * as writeRepository from "./proposals.write.repository";

export interface SubmitProposalInput {
	tenderId: number;
	amount: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
	/** The proposal document. Required: a bid is filed with the case for it. */
	file: File;
}

export type SubmitProposalResult =
	| { status: "ok"; proposal: ProposalSummary }
	| { status: "no_profile" }
	| { status: "unverified" }
	| { status: "tender_not_found" }
	| { status: "tender_closed" }
	| { status: "not_invited" }
	| { status: "deadline_passed" }
	| { status: "duplicate" }
	| { status: "conflict" }
	| { status: "load_failed" };

/** The document goes to R2 first and the row is written with it, so a bid exists complete or not at all. */
export async function submitProposal(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	input: SubmitProposalInput,
): Promise<SubmitProposalResult> {
	const profile = await repository.findVendorByUser(db, userId);
	if (!profile) return { status: "no_profile" };
	if (!profile.verifiedAt) return { status: "unverified" };

	const tender = await repository.findTenderById(db, input.tenderId);
	if (!tender) return { status: "tender_not_found" };
	if (tender.status !== "open") return { status: "tender_closed" };
	// A closed or direct tender is bid on by invitation only.
	if (
		!(await isTenderVisibleTo(db, tender.projectId, profile.id, tender.method))
	) {
		return { status: "not_invited" };
	}
	if (tender.deadlineAt && tender.deadlineAt.getTime() < Date.now()) {
		return { status: "deadline_passed" };
	}

	const duplicate = await repository.findProposalIdByTenderVendor(
		db,
		input.tenderId,
		profile.id,
	);
	if (duplicate) return { status: "duplicate" };

	const documentKey = `vendor-proposals/${profile.id}/${crypto.randomUUID()}/${input.file.name}`;
	await env.R2.put(documentKey, await input.file.arrayBuffer(), {
		httpMetadata: { contentType: "application/pdf" },
	});

	const inserted = await writeRepository.insertProposalAtomically(db, {
		tenderId: input.tenderId,
		vendorId: profile.id,
		amount: input.amount,
		technicalSpec: input.technicalSpec,
		operationalCost: input.operationalCost,
		projectedRoi: input.projectedRoi,
		warrantyPeriod: input.warrantyPeriod,
		documentName: input.file.name,
		documentKey,
	});
	if (!inserted) {
		await env.R2.delete(documentKey);
		return { status: "conflict" };
	}

	await recordAudit(db, {
		userId,
		projectId: tender.projectId,
		action: "proposal.submitted",
		entityType: "proposal",
		entityId: inserted.id,
		metadata: {
			amount: input.amount,
			tenderId: input.tenderId,
			documentName: input.file.name,
		},
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

export async function withdrawVendorProposal(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	proposalId: number,
): Promise<WithdrawProposalResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const row = await repository.findProposalWithTender(db, proposalId, vendorId);
	if (!row) return { status: "not_found" };

	if (row.proposal.status !== "submitted") return { status: "locked" };

	await writeRepository.withdrawProposalWithAudit(db, {
		proposalId,
		userId,
		projectId: row.tender.projectId,
		amount: row.proposal.amount,
	});
	// The row is the source of truth: an object with no row is unreachable, so the document goes with the bid.
	if (row.proposal.documentKey) {
		await env.R2.delete(row.proposal.documentKey);
	}
	return { status: "ok" };
}
