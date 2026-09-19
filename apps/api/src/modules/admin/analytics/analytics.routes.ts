import { Hono } from "hono";
import type { AdminAnalytics, AdminAnalyticsPoint } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { factory } from "../admin.shared";
import {
	selectCarbonReductionByMonth,
	selectCarbonReductionTarget,
	selectInvestmentsByMonth,
	selectOrganizationsByMonth,
	selectProjectsByMonth,
	selectRoiPaidByMonth,
	selectUsersByMonth,
} from "./analytics.repository";

/** Length of the trailing series the dashboard and analytics charts render. */
const WINDOW_MONTHS = 12;

type MonthRows = { month: string | null; value: number }[];

/** The last `count` calendar months in UTC, oldest first. */
function trailingMonths(count: number, now = new Date()): string[] {
	const months: string[] = [];
	for (let offset = count - 1; offset >= 0; offset--) {
		const month = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
		);
		months.push(month.toISOString().slice(0, 7));
	}
	return months;
}

/** Grouped rows indexed by month, so the series can be zero-filled. */
function byMonth(rows: MonthRows): Map<string, number> {
	const index = new Map<string, number>();
	for (const row of rows) {
		if (row.month) index.set(row.month, row.value);
	}
	return index;
}

/** Sum over every month reported, not just the visible window. */
function sum(rows: MonthRows): number {
	return rows.reduce((total, row) => total + row.value, 0);
}

export const analyticsRoutes = new Hono<ApiEnv>();

analyticsRoutes.get(
	"/analytics",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [
			usersRows,
			organizationsRows,
			projectsRows,
			investmentsRows,
			roiPaidRows,
			carbonRows,
			carbonReductionTarget,
		] = await Promise.all([
			selectUsersByMonth(db),
			selectOrganizationsByMonth(db),
			selectProjectsByMonth(db),
			selectInvestmentsByMonth(db),
			selectRoiPaidByMonth(db),
			selectCarbonReductionByMonth(db),
			selectCarbonReductionTarget(db),
		]);

		const users = byMonth(usersRows);
		const organizations = byMonth(organizationsRows);
		const projects = byMonth(projectsRows);
		const investments = byMonth(investmentsRows);
		const roiPaid = byMonth(roiPaidRows);
		const carbon = byMonth(carbonRows);

		const monthly: AdminAnalyticsPoint[] = trailingMonths(WINDOW_MONTHS).map(
			(month) => ({
				month,
				users: users.get(month) ?? 0,
				organizations: organizations.get(month) ?? 0,
				projects: projects.get(month) ?? 0,
				investments: investments.get(month) ?? 0,
				roiPaid: roiPaid.get(month) ?? 0,
				carbonReduction: carbon.get(month) ?? 0,
			}),
		);

		const analytics: AdminAnalytics = {
			monthly,
			totals: {
				users: sum(usersRows),
				organizations: sum(organizationsRows),
				projects: sum(projectsRows),
				investments: sum(investmentsRows),
				roiPaid: sum(roiPaidRows),
				carbonReduction: sum(carbonRows),
				carbonReductionTarget,
			},
		};
		return c.json(analytics);
	}),
);
