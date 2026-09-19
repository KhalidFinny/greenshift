import { and, count, eq, isNotNull, type SQL, sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import type { GreenShiftDb } from "../../../db";
import {
	emissionReports,
	investments,
	projects,
	roiPayments,
	users,
} from "../../../db/schema";

/**
 * Grouping key of a timestamp column as `YYYY-MM` in UTC.
 *
 * Timestamps are stored as epoch milliseconds, so the value is scaled to seconds
 * before `strftime` reads it. The same expression is used for grouping and for
 * the selected key, which keeps both in lockstep.
 */
function monthKey(source: AnySQLiteColumn | SQL) {
	return sql<string>`strftime('%Y-%m', ${source} / 1000, 'unixepoch')`;
}

/** An account counts as an organization once it carries a company name. */
const hasCompany = sql<number>`sum(case when ${users.companyName} is not null then 1 else 0 end)`;

/** Registered accounts per month. */
export async function selectUsersByMonth(db: GreenShiftDb) {
	return db
		.select({ month: monthKey(users.createdAt), value: count() })
		.from(users)
		.groupBy(monthKey(users.createdAt));
}

/** Registered accounts carrying a company name, per month. */
export async function selectOrganizationsByMonth(db: GreenShiftDb) {
	return db
		.select({ month: monthKey(users.createdAt), value: hasCompany })
		.from(users)
		.groupBy(monthKey(users.createdAt));
}

/** Projects submitted per month. */
export async function selectProjectsByMonth(db: GreenShiftDb) {
	return db
		.select({ month: monthKey(projects.createdAt), value: count() })
		.from(projects)
		.groupBy(monthKey(projects.createdAt));
}

/** Bond money taken in per month. */
export async function selectInvestmentsByMonth(db: GreenShiftDb) {
	return db
		.select({
			month: monthKey(investments.createdAt),
			value: sql<number>`coalesce(sum(${investments.amount}), 0)`,
		})
		.from(investments)
		.groupBy(monthKey(investments.createdAt));
}

/** ROI actually paid out per month. */
export async function selectRoiPaidByMonth(db: GreenShiftDb) {
	return db
		.select({
			month: monthKey(roiPayments.paidAt),
			value: sql<number>`coalesce(sum(${roiPayments.amount}), 0)`,
		})
		.from(roiPayments)
		.where(and(eq(roiPayments.status, "paid"), isNotNull(roiPayments.paidAt)))
		.groupBy(monthKey(roiPayments.paidAt));
}

/**
 * Measured emission reduction per month, dated to the end of the reporting
 * period (falling back to the upload date when a report has no period end).
 */
export async function selectCarbonReductionByMonth(db: GreenShiftDb) {
	const period = sql`coalesce(${emissionReports.periodEnd}, ${emissionReports.createdAt})`;
	return db
		.select({
			month: monthKey(period),
			value: sql<number>`coalesce(sum(${emissionReports.emissionReduction}), 0)`,
		})
		.from(emissionReports)
		.groupBy(monthKey(period));
}

/** Tonnes of CO2e every project on the platform targets in total. */
export async function selectCarbonReductionTarget(db: GreenShiftDb) {
	const rows = await db
		.select({
			value: sql<number>`coalesce(sum(${projects.targetEmissionReduction}), 0)`,
		})
		.from(projects);
	return rows[0]?.value ?? 0;
}
