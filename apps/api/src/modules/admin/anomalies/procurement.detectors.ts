import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import type { AnomalyPush } from "./anomaly-report";
import {
	selectOverRevisedProposals,
	selectStaleTenders,
} from "./anomalies.repository";

export async function collectProcurementAnomalies(
	db: GreenShiftDb,
	push: AnomalyPush,
): Promise<void> {
	for (const { proposal, projectTitle } of await selectOverRevisedProposals(
		db,
	)) {
		push({
			category: "proposal",
			code: "revision_limit",
			severity: "medium",
			title: "Proposal exceeded the revision limit",
			detail: `Proposal ${projectTitle} reached ${proposal.revisionCount} revisions (limit 3).`,
			entityType: "proposal",
			entityId: proposal.id,
			entityLabel: projectTitle,
			createdAt: proposal.updatedAt,
		});
	}

	for (const { tender, projectTitle } of await selectStaleTenders(db)) {
		push({
			category: "tender",
			code: "stale",
			severity: "medium",
			title: "Tender past its deadline",
			detail: `Tender ${projectTitle} is still open past the deadline ${iso(tender.deadlineAt)?.slice(0, 10)}.`,
			entityType: "tender",
			entityId: tender.id,
			entityLabel: projectTitle,
			createdAt: tender.deadlineAt,
		});
	}
}
