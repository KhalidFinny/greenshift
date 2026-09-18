import type {
	VendorMilestone,
	VendorMilestoneEvidence,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	evidenceEntry,
	milestoneEntry,
	recordAudit,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./delivery.repository";

export interface MilestoneEvidenceInput {
	kind: string;
	fileName: string;
	fileUrl: string | null;
	notes: string | null;
}

export type AddMilestoneEvidenceResult =
	| {
			status: "ok";
			evidence: VendorMilestoneEvidence;
			milestone: VendorMilestone | null;
	  }
	| { status: "not_found" }
	| { status: "forbidden" }
	| { status: "insert_failed" };

// Attach delivery evidence to a milestone of an awarded project. Uploading
// sends the milestone back for company review unless it is already approved.
export async function addMilestoneEvidence(
	db: GreenShiftDb,
	userId: number,
	milestoneId: number,
	input: MilestoneEvidenceInput,
): Promise<AddMilestoneEvidenceResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const row = await repository.findMilestoneWithProject(db, milestoneId);
	if (!row) return { status: "not_found" };

	const awarded = await repository.findAwardedProposalId(
		db,
		row.projectId,
		vendorId,
	);
	if (!awarded) return { status: "forbidden" };

	const inserted = await repository.insertMilestoneEvidence(db, {
		milestoneId,
		kind: input.kind,
		fileName: input.fileName,
		fileUrl: input.fileUrl,
		notes: input.notes,
	});
	if (!inserted) return { status: "insert_failed" };

	if (row.milestone.status !== "APPROVED") {
		await repository.setMilestoneStatus(
			db,
			milestoneId,
			"SUBMITTED_FOR_REVIEW",
		);
	}

	await recordAudit(db, {
		userId,
		projectId: row.projectId,
		action: "milestone.evidence.uploaded",
		entityType: "milestone_evidence",
		entityId: inserted.id,
		metadata: { milestoneId, fileName: input.fileName },
	});

	const evidence = await repository.listMilestoneEvidence(db, milestoneId);

	const milestone = await repository.findMilestone(db, milestoneId);

	return {
		status: "ok",
		evidence: evidenceEntry(inserted),
		milestone: milestone ? milestoneEntry(milestone, evidence) : null,
	};
}
