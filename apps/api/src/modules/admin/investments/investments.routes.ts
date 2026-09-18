import { Hono } from "hono";
import type { AdminInvestment } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { iso, parseLimit } from "../../../lib/format";
import { factory } from "../admin.shared";
import { listInvestments } from "./investments.repository";

export const investmentRoutes = new Hono<ApiEnv>();

investmentRoutes.get(
	"/investments",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		const validStatuses = ["active", "completed", "defaulted"];
		const limit = parseLimit(c.req.query("limit"));

		if (status && !validStatuses.includes(status)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid status" } },
				400,
			);
		}

		const rows = await listInvestments(db, status, limit);

		const list: AdminInvestment[] = rows.map(
			({ investment, investor, projectTitle }) => ({
				id: investment.id,
				investorName: investor.name,
				investorEmail: investor.email,
				projectTitle,
				amount: investment.amount,
				roiPaid: investment.roiPaid ?? 0,
				status: investment.status,
				bondSerialNumber: investment.bondSerialNumber,
				investedAt: iso(investment.investedAt),
			}),
		);
		return c.json({ investments: list });
	}),
);
