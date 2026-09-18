import { eq } from "drizzle-orm";
import type {
	BrokerAssignmentResponseBody,
	BrokerBondUpdateBody,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type {
	BondIssuanceStatus,
	BrokerWorkflowStatus,
} from "../../../db/schema";
import { auditLogs, brokerAssignments } from "../../../db/schema";
import { getAssignment, notify } from "../broker.shared";

/** Broker-side lifecycle (§20): forward steps, with a one-step correction. */
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
	DOCUMENT_COLLECTION: ["UNDER_REVIEW"],
	UNDER_REVIEW: ["DOCUMENT_COLLECTION", "READY_FOR_BOND_ISSUANCE"],
	READY_FOR_BOND_ISSUANCE: ["UNDER_REVIEW", "BOND_ISSUANCE"],
	BOND_ISSUANCE: ["MONITORING"],
	MONITORING: ["COMPLETED"],
	COMPLETED: [],
	ASSIGNED: [],
	DECLINED: [],
};

export const BOND_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "ISSUED"];

export type AssignmentResponseResult =
	| { outcome: "ok" }
	| { outcome: "not_found" }
	| { outcome: "conflict"; message: string }
	| { outcome: "invalid"; message: string };

export type ProjectMutationResult =
	| { outcome: "ok" }
	| { outcome: "not_found" }
	| { outcome: "conflict"; message: string };

export interface AssignmentResponseInput {
	brokerId: number;
	userName: string;
	projectId: number;
	body: BrokerAssignmentResponseBody;
}

/** Accept, decline or ask for more information on an assignment (§21). */
export async function respondToAssignment(
	db: GreenShiftDb,
	input: AssignmentResponseInput,
): Promise<AssignmentResponseResult> {
	const { brokerId, userName, projectId, body } = input;
	const row = await getAssignment(db, brokerId, projectId);
	if (!row) return { outcome: "not_found" };
	if (row.assignment.status !== "ASSIGNED") {
		return {
			outcome: "conflict",
			message: "This assignment has already been answered",
		};
	}

	if (body.action === "DECLINE") {
		const reason = body.reason?.trim();
		if (!reason) {
			return {
				outcome: "invalid",
				message: "A reason is required to decline an assignment",
			};
		}
		await db
			.update(brokerAssignments)
			.set({
				status: "DECLINED",
				declineReason: reason,
				respondedAt: new Date(),
			})
			.where(eq(brokerAssignments.id, row.assignment.id));

		await db.insert(auditLogs).values({
			userId: brokerId,
			projectId,
			action: "broker.assignment_declined",
			entityType: "broker_assignment",
			entityId: row.assignment.id,
			metadata: { reason },
		});
		await notify(db, row.assignment.companyId, {
			type: "assignment",
			title: `Broker declined: ${row.project.title}`,
			body: `${userName} declined the assignment. Reason: ${reason}. You can select another broker.`,
			link: "/business",
		});
		return { outcome: "ok" };
	}

	if (body.action === "REQUEST_INFORMATION") {
		const message = body.message?.trim();
		if (!message) {
			return {
				outcome: "invalid",
				message: "Describe the information you need",
			};
		}
		await db
			.update(brokerAssignments)
			.set({ informationRequest: message })
			.where(eq(brokerAssignments.id, row.assignment.id));
		await notify(db, row.assignment.companyId, {
			type: "assignment",
			title: `Information requested: ${row.project.title}`,
			body: message,
			link: "/business",
		});
		return { outcome: "ok" };
	}

	await db
		.update(brokerAssignments)
		.set({
			status: "DOCUMENT_COLLECTION",
			respondedAt: new Date(),
			declineReason: null,
		})
		.where(eq(brokerAssignments.id, row.assignment.id));

	await db.insert(auditLogs).values({
		userId: brokerId,
		projectId,
		action: "broker.assignment_accepted",
		entityType: "broker_assignment",
		entityId: row.assignment.id,
		metadata: null,
	});
	await notify(db, row.assignment.companyId, {
		type: "assignment",
		title: `Broker accepted: ${row.project.title}`,
		body: `${userName} accepted the assignment and started document collection.`,
		link: "/business",
	});
	return { outcome: "ok" };
}

/** Moves the assignment along the broker-side bond-preparation lifecycle (§20-§24). */
export async function changeProjectStatus(
	db: GreenShiftDb,
	input: { brokerId: number; projectId: number; status: string },
): Promise<ProjectMutationResult> {
	const { brokerId, projectId, status } = input;
	const row = await getAssignment(db, brokerId, projectId);
	if (!row) return { outcome: "not_found" };

	const allowed = WORKFLOW_TRANSITIONS[row.assignment.status] ?? [];
	if (!allowed.includes(status)) {
		return {
			outcome: "conflict",
			message: `Cannot move the project from ${row.assignment.status} to ${status}`,
		};
	}

	const nextStatus = status as BrokerWorkflowStatus;
	await db
		.update(brokerAssignments)
		.set({
			status: nextStatus,
			...(nextStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
		})
		.where(eq(brokerAssignments.id, row.assignment.id));

	await db.insert(auditLogs).values({
		userId: brokerId,
		projectId,
		action: `broker.status_${status.toLowerCase()}`,
		entityType: "broker_assignment",
		entityId: row.assignment.id,
		metadata: { from: row.assignment.status, to: nextStatus },
	});
	await notify(db, row.assignment.companyId, {
		type: "status_change",
		title: `Broker status updated: ${row.project.title}`,
		body: `The broker moved the project to ${status.replace(/_/g, " ").toLowerCase()}.`,
		link: "/business",
	});
	return { outcome: "ok" };
}

/** External bond tracking (§25-§26). */
export async function updateBondStatus(
	db: GreenShiftDb,
	input: { brokerId: number; projectId: number; body: BrokerBondUpdateBody },
): Promise<ProjectMutationResult> {
	const { brokerId, projectId, body } = input;
	const status = body.status as BondIssuanceStatus;
	const row = await getAssignment(db, brokerId, projectId);
	if (!row) return { outcome: "not_found" };

	// An issued bond implies the project entered the issuance stage.
	const nextWorkflow =
		status === "ISSUED" &&
		(row.assignment.status === "READY_FOR_BOND_ISSUANCE" ||
			row.assignment.status === "DOCUMENT_COLLECTION" ||
			row.assignment.status === "UNDER_REVIEW")
			? "BOND_ISSUANCE"
			: row.assignment.status;

	await db
		.update(brokerAssignments)
		.set({
			bondStatus: status,
			status: nextWorkflow,
			...(body.serialNumber !== undefined
				? { bondSerialNumber: body.serialNumber }
				: {}),
			...(body.amount !== undefined ? { bondAmount: body.amount } : {}),
			...(body.tenorMonths !== undefined
				? { tenorMonths: body.tenorMonths }
				: {}),
			...(body.couponRatePercent !== undefined
				? { couponRatePercent: body.couponRatePercent }
				: {}),
			...(body.issuanceDate !== undefined
				? { issuanceDate: new Date(body.issuanceDate) }
				: {}),
			...(body.maturityDate !== undefined
				? { maturityDate: new Date(body.maturityDate) }
				: {}),
		})
		.where(eq(brokerAssignments.id, row.assignment.id));

	await db.insert(auditLogs).values({
		userId: brokerId,
		projectId,
		action: "broker.bond_status_updated",
		entityType: "broker_assignment",
		entityId: row.assignment.id,
		metadata: { from: row.assignment.bondStatus, to: status },
	});
	await notify(db, row.assignment.companyId, {
		type: "bond",
		title: `Bond status: ${row.project.title}`,
		body: `The broker set the external bond status to ${status.replace(/_/g, " ").toLowerCase()}.`,
		link: "/business",
	});
	return { outcome: "ok" };
}
