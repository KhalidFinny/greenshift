import { eq } from "drizzle-orm";
import type { BrokerBondUpdateBody } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { BondIssuanceStatus } from "../../../db/schema";
import { auditLogs, brokerAssignments } from "../../../db/schema";
import { getAssignment, notify } from "../broker.shared";
import type { ProjectMutationResult } from "./projects.service";

export const BOND_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "ISSUED"];

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
