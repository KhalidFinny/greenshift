import type { ProposalDetail } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals } from "../../../db/schema";
import { getProposalDetail, recordAudit } from "../vendor.shared";
import * as repository from "./proposal-update.repository";

export const MAX_REVISIONS = 3;

export interface UpdateProposalInput {
	amount?: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
	note?: string;
}

export type UpdateProposalResult =
	| { status: "ok"; detail: ProposalDetail | null }
	| { status: "not_found" }
	| { status: "unverified" }
	| { status: "locked" }
	| { status: "revision_limit" }
	| { status: "revision_conflict" };

// Update own proposal: free edit while "submitted", or respond to a revision
// request while "revision" (revisionCount++, revision trail, back to submitted).
export async function updateVendorProposal(
	db: GreenShiftDb,
	userId: number,
	proposalId: number,
	input: UpdateProposalInput,
): Promise<UpdateProposalResult> {
	const profile = await repository.findVendorIdWithVerification(db, userId);
	if (!profile) return { status: "not_found" };
	if (!profile.verifiedAt) return { status: "unverified" };

	const currentRow = await repository.findProposalWithTender(
		db,
		proposalId,
		profile.id,
	);
	if (!currentRow) return { status: "not_found" };
	const current = currentRow.proposal;

	if (
		current.status === "reviewed" ||
		current.status === "accepted" ||
		current.status === "rejected"
	) {
		return { status: "locked" };
	}

	const patch: Partial<typeof proposals.$inferInsert> = {};
	if (input.amount !== undefined) patch.amount = input.amount;
	if (input.technicalSpec !== undefined)
		patch.technicalSpec = input.technicalSpec;
	if (input.operationalCost !== undefined) {
		patch.operationalCost = input.operationalCost;
	}
	if (input.projectedRoi !== undefined) patch.projectedRoi = input.projectedRoi;
	if (input.warrantyPeriod !== undefined) {
		patch.warrantyPeriod = input.warrantyPeriod;
	}

	const isRevisionResponse = current.status === "revision";

	let updated: typeof proposals.$inferSelect | undefined;
	if (isRevisionResponse) {
		if ((current.revisionCount ?? 0) >= MAX_REVISIONS) {
			return { status: "revision_limit" };
		}
		const claimed = await repository.claimRevision(db, {
			proposalId: current.id,
			patch,
			maxRevisions: MAX_REVISIONS,
		});
		if (!claimed) return { status: "revision_conflict" };

		await repository.insertProposalRevision(db, {
			proposalId: current.id,
			revisionNumber: claimed.revisionCount ?? 0,
			note: input.note ?? null,
			amount: input.amount ?? current.amount,
			previousAmount: current.amount,
			createdBy: "vendor",
		});
		updated = claimed;
	} else {
		const row = await repository.updateProposalFields(db, current.id, patch);
		if (!row) return { status: "not_found" };
		updated = row;
	}

	await recordAudit(db, {
		userId,
		projectId: currentRow.tender.projectId,
		action: isRevisionResponse ? "proposal.revised" : "proposal.updated",
		entityType: "proposal",
		entityId: updated.id,
		metadata: {
			amount: updated.amount,
			revisionNumber: isRevisionResponse ? updated.revisionCount : undefined,
		},
	});

	const detail = await getProposalDetail(db, updated.id, profile.id);
	return { status: "ok", detail };
}
