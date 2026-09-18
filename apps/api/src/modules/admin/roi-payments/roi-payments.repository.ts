import { and, desc, eq, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	auditLogs,
	investments,
	projects,
	roiPayments,
	users,
} from "../../../db/schema";

/** ROI payments with investor and project context, newest period first. */
export async function listRoiPayments(
	db: GreenShiftDb,
	status: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			payment: roiPayments,
			investmentId: investments.id,
			investorEmail: users.email,
			projectTitle: projects.title,
		})
		.from(roiPayments)
		.innerJoin(investments, eq(roiPayments.investmentId, investments.id))
		.innerJoin(users, eq(investments.investorId, users.id))
		.innerJoin(projects, eq(investments.projectId, projects.id))
		.$dynamic();
	if (status) {
		query.where(eq(roiPayments.status, status));
	}
	query.orderBy(desc(roiPayments.period)).limit(limit);
	const rows = await query;
	return rows;
}

/** Full payment row, used to evaluate the payout. */
export async function findRoiPayment(db: GreenShiftDb, id: number) {
	const [payment] = await db
		.select()
		.from(roiPayments)
		.where(eq(roiPayments.id, id))
		.limit(1);
	return payment;
}

/**
 * Flips a still-scheduled payment to paid. Returns the updated row, or
 * `undefined` when another request already processed it.
 */
export async function markRoiPaymentPaid(
	db: GreenShiftDb,
	input: { id: number; escrowTxId: string },
) {
	const [paid] = await db
		.update(roiPayments)
		.set({ status: "paid", escrowTxId: input.escrowTxId, paidAt: new Date() })
		.where(
			and(eq(roiPayments.id, input.id), eq(roiPayments.status, "scheduled")),
		)
		.returning();
	return paid;
}

/** Credits the investment's roiPaid and records the audit entry in one batch. */
export async function creditRoiPayment(
	db: GreenShiftDb,
	input: {
		paymentId: number;
		investmentId: number;
		amount: number;
		period: string | null;
		escrowTxId: string;
		actorId: number;
	},
): Promise<void> {
	await db.batch([
		db
			.update(investments)
			.set({
				roiPaid: sql`${investments.roiPaid} + ${input.amount}`,
			})
			.where(eq(investments.id, input.investmentId)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "roi.payment_paid",
			entityType: "roi_payment",
			entityId: input.paymentId,
			metadata: {
				escrowTxId: input.escrowTxId,
				amount: input.amount,
				period: input.period,
			},
		}),
	]);
}
