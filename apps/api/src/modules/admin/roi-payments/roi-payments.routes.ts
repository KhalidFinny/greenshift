import { Hono } from "hono";
import type { AdminRoiPayment } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { factory } from "../admin.shared";
import { listRoiPayments } from "./roi-payments.repository";
import { payRoiPayment } from "./roi-payments.service";

export const roiPaymentRoutes = new Hono<ApiEnv>();

roiPaymentRoutes.get(
	"/roi-payments",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		const validStatuses = ["scheduled", "paid", "failed"];
		const limit = parseLimit(c.req.query("limit"));

		if (status && !validStatuses.includes(status)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid status" } },
				400,
			);
		}

		const rows = await listRoiPayments(db, status, limit);

		const list: AdminRoiPayment[] = rows.map(
			({ payment, investmentId, investorEmail, projectTitle }) => ({
				id: payment.id,
				investmentId,
				investorEmail,
				projectTitle,
				period: payment.period,
				amount: payment.amount,
				status: payment.status,
				escrowTxId: payment.escrowTxId,
				paidAt: iso(payment.paidAt),
			}),
		);
		return c.json({ payments: list });
	}),
);

// Sandbox escrow payout: marks a scheduled payment paid and credits the
// investment's roiPaid. No real money moves (MVP simulation).
roiPaymentRoutes.post(
	"/roi-payments/:id/payout",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const result = await payRoiPayment(createDb(c.env.DB), {
			id,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			if (result.reason === "not_found") {
				return c.json(
					{ error: { code: "NOT_FOUND", message: "Payment not found" } },
					404,
				);
			}
			return c.json(
				{
					error: {
						code: "ALREADY_PAID",
						message: "Payment already processed",
					},
				},
				409,
			);
		}

		return c.json({ ok: true, escrowTxId: result.escrowTxId });
	}),
);
