import type { AdminAnomaly } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	selectAnomalousEmissionReports,
	selectBadBondSerials,
	selectFailedRoiPayments,
	selectOverfundedProjects,
	selectOverRevisedProposals,
	selectPaidRoiPayments,
	selectProjectsWithoutMrv,
	selectRogueBlueprints,
	selectStaleTenders,
	selectUnverifiedUsers,
	selectVendorsWithoutProfile,
} from "./anomalies.repository";

const SEVERITY_RANK: Record<AdminAnomaly["severity"], number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};

export type AnomalyReport = {
	flags: AdminAnomaly[];
	counts: Record<AdminAnomaly["severity"] | "total", number>;
};

/** Read-only rule engine: admin monitors, never mutates operational state. */
export async function detectAnomalies(
	db: GreenShiftDb,
): Promise<AnomalyReport> {
	const flags: AdminAnomaly[] = [];

	const push = (
		category: string,
		kind: string,
		severity: AdminAnomaly["severity"],
		title: string,
		detail: string,
		entityType: string | null,
		entityId: number | null,
		entityLabel: string | null,
		createdAt: Date | null,
	) => {
		flags.push({
			id: `${category}.${kind}-${entityId ?? flags.length}`,
			code: kind,
			category,
			severity,
			title,
			description: detail,
			detail,
			projectId: null,
			entityType,
			entityId,
			entityLabel,
			createdAt: iso(createdAt),
		});
	};

	for (const { blueprint, projectTitle } of await selectRogueBlueprints(db)) {
		push(
			"blueprint",
			"published_invalid",
			"critical",
			"Blueprint published without validation",
			`Blueprint for project "${projectTitle}" is published with no auditor validation trail.`,
			"blueprint",
			blueprint.id,
			projectTitle,
			blueprint.publishedAt,
		);
	}

	for (const { report, projectTitle } of await selectAnomalousEmissionReports(
		db,
	)) {
		push(
			"emission",
			"anomaly",
			"high",
			"Emission report anomaly detected",
			report.anomalyNote ??
				`Actual consumption deviates from baseline (score ${report.anomalyScore ?? "?"}).`,
			"emission_report",
			report.id,
			projectTitle,
			report.createdAt,
		);
	}

	for (const {
		payment,
		investorEmail,
		projectTitle,
	} of await selectFailedRoiPayments(db)) {
		push(
			"payout",
			"failed",
			"high",
			"ROI payment failed",
			`Payment for ${projectTitle} to ${investorEmail} has status failed.`,
			"roi_payment",
			payment.id,
			investorEmail,
			payment.createdAt,
		);
	}

	const paidPayments = await selectPaidRoiPayments(db);
	const seenTx = new Map<string, (typeof paidPayments)[number]>();
	for (const payment of paidPayments) {
		if (payment.status !== "paid") continue;
		if (!payment.escrowTxId) {
			push(
				"payout",
				"no_tx",
				"high",
				"Payment without an escrow reference",
				`ROI payment ${payment.period ?? `#${payment.id}`} has status paid without an escrowTxId.`,
				"roi_payment",
				payment.id,
				null,
				payment.paidAt,
			);
			continue;
		}
		const seen = seenTx.get(payment.escrowTxId);
		if (seen) {
			push(
				"payout",
				"dup_tx",
				"high",
				"Escrow transaction used twice",
				`${payment.escrowTxId} is used by payments #${seen.id} and #${payment.id}.`,
				"roi_payment",
				payment.id,
				payment.escrowTxId,
				payment.paidAt,
			);
		} else {
			seenTx.set(payment.escrowTxId, payment);
		}
	}

	for (const row of await selectOverfundedProjects(db)) {
		push(
			"funding",
			"overcap",
			"high",
			"Funding exceeds budget",
			`Project "${row.projectTitle}" is funded ${row.funded.toLocaleString("en-US")} against a ${row.budget?.toLocaleString("en-US")} budget.`,
			"project",
			row.projectId,
			row.projectTitle,
			null,
		);
	}

	for (const {
		investment,
		investorEmail,
		projectTitle,
	} of await selectBadBondSerials(db)) {
		push(
			"bond",
			"bad_serial",
			"low",
			"Bond serial number does not match the format",
			`Bond ${investment.bondSerialNumber} (${investorEmail}, ${projectTitle}) is outside the GS-* format.`,
			"investment",
			investment.id,
			investment.bondSerialNumber,
			investment.investedAt,
		);
	}

	for (const { proposal, projectTitle } of await selectOverRevisedProposals(
		db,
	)) {
		push(
			"proposal",
			"revision_limit",
			"medium",
			"Proposal exceeded the revision limit",
			`Proposal ${projectTitle} reached ${proposal.revisionCount} revisions (limit 3).`,
			"proposal",
			proposal.id,
			projectTitle,
			proposal.updatedAt,
		);
	}

	for (const { tender, projectTitle } of await selectStaleTenders(db)) {
		push(
			"tender",
			"stale",
			"medium",
			"Tender past its deadline",
			`Tender ${projectTitle} is still open past the deadline ${iso(tender.deadlineAt)?.slice(0, 10)}.`,
			"tender",
			tender.id,
			projectTitle,
			tender.deadlineAt,
		);
	}

	for (const user of await selectUnverifiedUsers(db)) {
		push(
			"user",
			"unverified",
			"medium",
			"Account not yet verified",
			`${user.role} account ${user.email} is active without verification.`,
			"user",
			user.id,
			user.email,
			user.createdAt,
		);
	}

	for (const { user } of await selectVendorsWithoutProfile(db)) {
		push(
			"vendor",
			"no_profile",
			"medium",
			"Vendor without a profile",
			`Vendor account ${user.email} has no vendor profile.`,
			"user",
			user.id,
			user.email,
			user.createdAt,
		);
	}

	for (const { project } of await selectProjectsWithoutMrv(db)) {
		push(
			"project",
			"no_mrv",
			"low",
			"Project without an MRV report",
			`Project "${project.title}" has status ${project.status} with no emission reports.`,
			"project",
			project.id,
			project.title,
			project.createdAt,
		);
	}

	flags.sort(
		(a, b) =>
			SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
			(b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
			// Stable tiebreaker: rows sharing a severity and timestamp come back in arbitrary
			// order otherwise.
			String(a.id).localeCompare(String(b.id)),
	);

	const counts = {
		critical: 0,
		high: 0,
		medium: 0,
		low: 0,
		total: flags.length,
	};
	for (const flag of flags) counts[flag.severity]++;

	return { flags: flags.slice(0, 100), counts };
}
