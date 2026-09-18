import { count, countDistinct, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	investments,
	projects,
	roiPayments,
	users,
} from "../../../db/schema";

export async function selectUsersByRole(db: GreenShiftDb) {
	return db
		.select({ role: users.role, count: count() })
		.from(users)
		.groupBy(users.role);
}

export async function selectProjectsByStatus(db: GreenShiftDb) {
	return db
		.select({ status: projects.status, count: count() })
		.from(projects)
		.groupBy(projects.status);
}

export async function selectInvestmentAggregate(db: GreenShiftDb) {
	return db
		.select({
			total: count(),
			sum: sql<number>`coalesce(sum(${investments.amount}), 0)`,
			roiPaid: sql<number>`coalesce(sum(${investments.roiPaid}), 0)`,
		})
		.from(investments);
}

export async function selectPaymentsByStatus(db: GreenShiftDb) {
	return db
		.select({ status: roiPayments.status, count: count() })
		.from(roiPayments)
		.groupBy(roiPayments.status);
}

export async function selectVerificationAggregate(db: GreenShiftDb) {
	return db
		.select({
			verified: sql<number>`coalesce(sum(case when ${users.verifiedAt} is not null then 1 else 0 end), 0)`,
			unverified: sql<number>`coalesce(sum(case when ${users.verifiedAt} is null then 1 else 0 end), 0)`,
		})
		.from(users);
}

export async function selectCompanyCount(db: GreenShiftDb) {
	return db
		.select({ count: countDistinct(users.companyName) })
		.from(users)
		.where(isNotNull(users.companyName));
}

export async function selectActiveInvestorCount(db: GreenShiftDb) {
	return db
		.select({ count: countDistinct(investments.investorId) })
		.from(investments);
}

export async function selectBlueprintsByStatus(db: GreenShiftDb) {
	return db
		.select({ status: blueprints.status, count: count() })
		.from(blueprints)
		.groupBy(blueprints.status);
}

export async function selectTopFundingProjects(db: GreenShiftDb) {
	return db
		.select({
			id: projects.id,
			title: projects.title,
			budget: projects.budget,
			funded: sql<number>`coalesce(sum(${investments.amount}), 0)`,
		})
		.from(projects)
		.leftJoin(investments, eq(investments.projectId, projects.id))
		.groupBy(projects.id, projects.title, projects.budget)
		.orderBy(desc(sql`coalesce(sum(${investments.amount}), 0)`))
		.limit(5);
}
