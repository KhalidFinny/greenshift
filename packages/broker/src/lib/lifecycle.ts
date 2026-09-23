import type { BrokerProjectWorkflowStatus } from "./types";

/** The broker lifecycle (§20) is separate from the GreenShift project lifecycle. */
export const WORKFLOW_LABELS: Record<BrokerProjectWorkflowStatus, string> = {
	ASSIGNED: "Assigned",
	DECLINED: "Declined",
	DOCUMENT_COLLECTION: "Document Collection",
	UNDER_REVIEW: "Under Review",
	READY_FOR_BOND_ISSUANCE: "Ready for Bond Issuance",
	BOND_ISSUANCE: "Bond Issuance",
	MONITORING: "Monitoring",
	COMPLETED: "Completed",
};

/** Mirrors the transitions the API accepts, including one-step corrections. */
const WORKFLOW_TRANSITIONS: Record<
	BrokerProjectWorkflowStatus,
	BrokerProjectWorkflowStatus[]
> = {
	ASSIGNED: [],
	DECLINED: [],
	DOCUMENT_COLLECTION: ["UNDER_REVIEW"],
	UNDER_REVIEW: ["DOCUMENT_COLLECTION", "READY_FOR_BOND_ISSUANCE"],
	READY_FOR_BOND_ISSUANCE: ["UNDER_REVIEW", "BOND_ISSUANCE"],
	BOND_ISSUANCE: ["MONITORING"],
	MONITORING: ["COMPLETED"],
	COMPLETED: [],
};

export function nextWorkflowStatuses(
	status: BrokerProjectWorkflowStatus,
): BrokerProjectWorkflowStatus[] {
	return WORKFLOW_TRANSITIONS[status] ?? [];
}

export function workflowLabel(status: string): string {
	return (
		WORKFLOW_LABELS[status as BrokerProjectWorkflowStatus] ??
		status.replace(/_/g, " ")
	);
}
