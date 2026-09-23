import type { GreenShiftDb } from "../../../db";
import {
	selectBadBondSerials,
	selectFailedRoiPayments,
	selectOverfundedProjects,
	selectPaidRoiPayments,
} from "./anomalies.repository";
import type { AnomalyPush } from "./anomaly-report";

export async function collectFundingAnomalies(
	db: GreenShiftDb,
	push: AnomalyPush,
): Promise<void> {
	for (const {
		payment,
		investorEmail,
		projectTitle,
	} of await selectFailedRoiPayments(db)) {
		push({
			category: "payout",
			code: "failed",
			severity: "high",
			title: "ROI payment failed",
			detail: `Payment for ${projectTitle} to ${investorEmail} has status failed.`,
			entityType: "roi_payment",
			entityId: payment.id,
			entityLabel: investorEmail,
			createdAt: payment.createdAt,
		});
	}

	const paidPayments = await selectPaidRoiPayments(db);
	const seenTx = new Map<string, (typeof paidPayments)[number]>();
	for (const payment of paidPayments) {
		if (payment.status !== "paid") continue;
		if (!payment.escrowTxId) {
			push({
				category: "payout",
				code: "no_tx",
				severity: "high",
				title: "Payment without an escrow reference",
				detail: `ROI payment ${payment.period ?? `#${payment.id}`} has status paid without an escrowTxId.`,
				entityType: "roi_payment",
				entityId: payment.id,
				entityLabel: null,
				createdAt: payment.paidAt,
			});
			continue;
		}
		const seen = seenTx.get(payment.escrowTxId);
		if (seen) {
			push({
				category: "payout",
				code: "dup_tx",
				severity: "high",
				title: "Escrow transaction used twice",
				detail: `${payment.escrowTxId} is used by payments #${seen.id} and #${payment.id}.`,
				entityType: "roi_payment",
				entityId: payment.id,
				entityLabel: payment.escrowTxId,
				createdAt: payment.paidAt,
			});
		} else {
			seenTx.set(payment.escrowTxId, payment);
		}
	}

	for (const row of await selectOverfundedProjects(db)) {
		push({
			category: "funding",
			code: "overcap",
			severity: "high",
			title: "Funding exceeds budget",
			detail: `Project "${row.projectTitle}" is funded ${row.funded.toLocaleString("en-US")} against a ${row.budget?.toLocaleString("en-US")} budget.`,
			entityType: "project",
			entityId: row.projectId,
			entityLabel: row.projectTitle,
			createdAt: null,
		});
	}

	for (const {
		investment,
		investorEmail,
		projectTitle,
	} of await selectBadBondSerials(db)) {
		push({
			category: "bond",
			code: "bad_serial",
			severity: "low",
			title: "Bond serial number does not match the format",
			detail: `Bond ${investment.bondSerialNumber} (${investorEmail}, ${projectTitle}) is outside the GS-* format.`,
			entityType: "investment",
			entityId: investment.id,
			entityLabel: investment.bondSerialNumber,
			createdAt: investment.investedAt,
		});
	}
}
