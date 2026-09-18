import { Hono } from "hono";
import type { AdminStats } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { factory } from "../admin.shared";
import {
	selectActiveInvestorCount,
	selectBlueprintsByStatus,
	selectCompanyCount,
	selectInvestmentAggregate,
	selectPaymentsByStatus,
	selectProjectsByStatus,
	selectTopFundingProjects,
	selectUsersByRole,
	selectVerificationAggregate,
} from "./stats.repository";

export const statsRoutes = new Hono<ApiEnv>();

statsRoutes.get(
	"/stats",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [usersByRole, projectsByStatus, investmentAgg, paymentsByStatus] =
			await Promise.all([
				selectUsersByRole(db),
				selectProjectsByStatus(db),
				selectInvestmentAggregate(db),
				selectPaymentsByStatus(db),
			]);

		const [
			verificationAgg,
			companiesAgg,
			investorsAgg,
			blueprintsByStatus,
			fundingRows,
		] = await Promise.all([
			selectVerificationAggregate(db),
			selectCompanyCount(db),
			selectActiveInvestorCount(db),
			selectBlueprintsByStatus(db),
			selectTopFundingProjects(db),
		]);

		const toRecord = (
			rows: { role?: string; status?: string; count: number }[],
		) =>
			rows.reduce<Record<string, number>>((acc, row) => {
				acc[(row.role ?? row.status) as string] = row.count;
				return acc;
			}, {});

		const stats: AdminStats = {
			users: toRecord(usersByRole),
			projects: toRecord(projectsByStatus),
			investments: {
				total: investmentAgg[0]?.total ?? 0,
				sum: investmentAgg[0]?.sum ?? 0,
				roiPaid: investmentAgg[0]?.roiPaid ?? 0,
			},
			payments: toRecord(paymentsByStatus),
			usersVerified: {
				verified: verificationAgg[0]?.verified ?? 0,
				unverified: verificationAgg[0]?.unverified ?? 0,
			},
			companies: companiesAgg[0]?.count ?? 0,
			investorsActive: investorsAgg[0]?.count ?? 0,
			blueprints: toRecord(blueprintsByStatus),
			funding: fundingRows.map((row) => ({
				id: row.id,
				title: row.title,
				budget: row.budget,
				funded: row.funded,
				progress: row.budget ? Math.min(row.funded / row.budget, 1) : 0,
			})),
		};
		return c.json(stats);
	}),
);
