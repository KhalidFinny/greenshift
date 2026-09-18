import type { BrokerDocumentReviewBody } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { DocumentCategory } from "../../../db/schema";
import { auditLogs } from "../../../db/schema";
import { notify } from "../broker.shared";
import {
	type DocumentRequestRow,
	getBrokerAssignment,
	getDocumentRequest,
	getProjectSummary,
	insertDocumentRequest,
	updateDocumentRequest,
} from "./documents.repository";

export interface DocumentRequestInput {
	brokerId: number;
	userName: string;
	projectId: number;
	category: DocumentCategory;
	documentTypeName: string;
	requiredPeriod: string | null;
	reason: string;
	deadline: Date;
	additionalNotes: string | null;
}

export type DocumentRequestCreateResult =
	| {
			outcome: "ok";
			request: DocumentRequestRow;
			project: { title: string; companyName: string } | undefined;
	  }
	| { outcome: "not_found" }
	| { outcome: "conflict"; message: string };

export type DocumentReviewResult =
	| { outcome: "ok"; request: DocumentRequestRow }
	| { outcome: "not_found" }
	| { outcome: "conflict"; message: string }
	| { outcome: "invalid"; message: string };

/**
 * Raises a document request on an accepted assignment. Document collection
 * starts once the broker accepts the assignment (§22).
 */
export async function createDocumentRequest(
	db: GreenShiftDb,
	input: DocumentRequestInput,
): Promise<DocumentRequestCreateResult> {
	const {
		brokerId,
		userName,
		projectId,
		category,
		documentTypeName,
		requiredPeriod,
		reason,
		deadline,
		additionalNotes,
	} = input;

	const assignment = await getBrokerAssignment(db, brokerId, projectId);
	if (!assignment) return { outcome: "not_found" };
	if (assignment.status === "ASSIGNED" || assignment.status === "DECLINED") {
		return {
			outcome: "conflict",
			message: "Accept the assignment before requesting documents",
		};
	}

	const [created] = await insertDocumentRequest(db, {
		assignmentId: assignment.id,
		projectId,
		brokerId,
		companyId: assignment.companyId,
		category,
		documentTypeName: documentTypeName.trim(),
		requiredPeriod,
		reason: reason.trim(),
		deadlineDate: deadline,
		additionalNotes,
	});

	const project = await getProjectSummary(db, projectId);

	await db.insert(auditLogs).values({
		userId: brokerId,
		projectId,
		action: "broker.document_requested",
		entityType: "document_request",
		entityId: created.id,
		metadata: { documentTypeName: created.documentTypeName },
	});
	await notify(db, assignment.companyId, {
		type: "documents",
		title: `Document requested: ${created.documentTypeName}`,
		body: `${userName} requested "${created.documentTypeName}"${
			created.requiredPeriod ? ` for ${created.requiredPeriod}` : ""
		}. Reason: ${created.reason}`,
		link: "/business",
	});

	return { outcome: "ok", request: created, project };
}

export interface DocumentReviewInput {
	brokerId: number;
	id: number;
	action: BrokerDocumentReviewBody["action"];
	reason?: string;
}

/** Document lifecycle from §18: SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED. */
export async function reviewDocumentRequest(
	db: GreenShiftDb,
	input: DocumentReviewInput,
): Promise<DocumentReviewResult> {
	const { brokerId, id, action, reason } = input;
	const row = await getDocumentRequest(db, id, brokerId);
	if (!row) return { outcome: "not_found" };

	const reviewable =
		row.status === "SUBMITTED" || row.status === "UNDER_REVIEW";
	if (action === "START_REVIEW" && row.status !== "SUBMITTED") {
		return {
			outcome: "conflict",
			message: "Only a submitted document can be taken into review",
		};
	}
	if (action !== "START_REVIEW" && !reviewable) {
		return {
			outcome: "conflict",
			message: "Only a submitted document can be reviewed",
		};
	}

	const rejectionReason = action === "REJECT" ? (reason?.trim() ?? "") : null;
	if (action === "REJECT" && !rejectionReason) {
		return {
			outcome: "invalid",
			message: "A reason is required to reject a document",
		};
	}

	const status =
		action === "START_REVIEW"
			? "UNDER_REVIEW"
			: action === "APPROVE"
				? "APPROVED"
				: "REJECTED";

	const [updated] = await updateDocumentRequest(db, id, {
		status,
		rejectionReason,
		...(action === "START_REVIEW" ? {} : { reviewedAt: new Date() }),
	});

	await db.insert(auditLogs).values({
		userId: brokerId,
		projectId: row.projectId,
		action: `broker.document_${status.toLowerCase()}`,
		entityType: "document_request",
		entityId: id,
		metadata: rejectionReason ? { reason: rejectionReason } : null,
	});

	if (action !== "START_REVIEW") {
		await notify(db, row.companyId, {
			type: "documents",
			title:
				action === "APPROVE"
					? `Document approved: ${row.documentTypeName}`
					: `Document rejected: ${row.documentTypeName}`,
			body:
				action === "APPROVE"
					? "The broker accepted your submission."
					: `Resubmission required. Reason: ${rejectionReason}`,
			link: "/business",
		});
	}

	return { outcome: "ok", request: updated };
}
