import type { GreenShiftDb } from "../../../db";
import {
	creditRoiPayment,
	findRoiPayment,
	markRoiPaymentPaid,
} from "./roi-payments.repository";

export type PayRoiPaymentResult =
	| { ok: true; escrowTxId: string }
	| { ok: false; reason: "not_found" }
	| { ok: false; reason: "already_paid" };

/**
 * Sandbox escrow payout: marks a scheduled payment paid and credits the
 * investment's roiPaid. No real money moves (MVP simulation).
 */
export async function payRoiPayment(
	db: GreenShiftDb,
	input: { id: number; actorId: number },
): Promise<PayRoiPaymentResult> {
	const payment = await findRoiPayment(db, input.id);
	if (!payment) return { ok: false, reason: "not_found" };
	if (payment.status !== "scheduled") {
		return { ok: false, reason: "already_paid" };
	}

	const escrowBytes = crypto.getRandomValues(new Uint8Array(8));
	const escrowTxId = `ESC-${payment.id}-${Array.from(escrowBytes, (b) =>
		b.toString(16).padStart(2, "0"),
	)
		.join("")
		.toUpperCase()}`;

	const paid = await markRoiPaymentPaid(db, { id: input.id, escrowTxId });
	if (!paid) return { ok: false, reason: "already_paid" };

	await creditRoiPayment(db, {
		paymentId: input.id,
		investmentId: payment.investmentId,
		amount: payment.amount,
		period: payment.period,
		escrowTxId,
		actorId: input.actorId,
	});

	return { ok: true, escrowTxId };
}
