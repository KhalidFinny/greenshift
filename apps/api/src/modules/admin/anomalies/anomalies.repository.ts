import {
	and,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	notLike,
	or,
	sql,
	sum,
} from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	emissionReports,
	investments,
	projects,
	proposals,
	roiPayments,
	tenders,
	users,
	vendors,
} from "../../../db/schema";

/** Blueprints published without a validation trail (governance breach). */
export async function selectRogueBlueprints(db: GreenShiftDb) {
	return db
		.select({
			blueprint: blueprints,
			projectTitle: projects.title,
		})
		.from(blueprints)
		.innerJoin(projects, eq(blueprints.projectId, projects.id))
		.where(
			and(
				eq(blueprints.status, "published"),
				or(isNull(blueprints.validatedAt), isNull(blueprints.auditorId)),
			),
		)
		.limit(50);
}

/** MRV anomaly: actual consumption deviates from promised savings. */
export async function selectAnomalousEmissionReports(db: GreenShiftDb) {
	return db
		.select({
			report: emissionReports,
			projectTitle: projects.title,
		})
		.from(emissionReports)
		.innerJoin(projects, eq(emissionReports.projectId, projects.id))
		.where(eq(emissionReports.anomalyFlagged, true))
		.orderBy(desc(emissionReports.createdAt))
		.limit(100);
}

export async function selectFailedRoiPayments(db: GreenShiftDb) {
	return db
		.select({
			payment: roiPayments,
			investorEmail: users.email,
			projectTitle: projects.title,
		})
		.from(roiPayments)
		.innerJoin(investments, eq(roiPayments.investmentId, investments.id))
		.innerJoin(users, eq(investments.investorId, users.id))
		.innerJoin(projects, eq(investments.projectId, projects.id))
		.where(eq(roiPayments.status, "failed"))
		.orderBy(desc(roiPayments.createdAt))
		.limit(100);
}

/** Payout integrity: payments carrying an escrow reference. */
export async function selectPaidRoiPayments(db: GreenShiftDb) {
	return db
		.select()
		.from(roiPayments)
		.where(isNotNull(roiPayments.escrowTxId))
		.orderBy(desc(roiPayments.createdAt))
		.limit(500);
}

export async function selectOverfundedProjects(db: GreenShiftDb) {
	return db
		.select({
			projectId: projects.id,
			projectTitle: projects.title,
			budget: projects.budget,
			funded: sql<number>`coalesce(sum(${investments.amount}), 0)`,
		})
		.from(investments)
		.innerJoin(projects, eq(investments.projectId, projects.id))
		.where(isNotNull(projects.budget))
		.groupBy(projects.id, projects.title, projects.budget)
		.having(gt(sum(investments.amount), projects.budget))
		.limit(50);
}

export async function selectBadBondSerials(db: GreenShiftDb) {
	return db
		.select({
			investment: investments,
			investorEmail: users.email,
			projectTitle: projects.title,
		})
		.from(investments)
		.innerJoin(users, eq(investments.investorId, users.id))
		.innerJoin(projects, eq(investments.projectId, projects.id))
		.where(
			and(
				isNotNull(investments.bondSerialNumber),
				notLike(investments.bondSerialNumber, "GS-%"),
			),
		)
		.limit(100);
}

export async function selectOverRevisedProposals(db: GreenShiftDb) {
	return db
		.select({
			proposal: proposals,
			projectTitle: projects.title,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(gte(proposals.revisionCount, 3))
		.orderBy(desc(proposals.updatedAt))
		.limit(100);
}

export async function selectStaleTenders(db: GreenShiftDb) {
	return db
		.select({
			tender: tenders,
			projectTitle: projects.title,
		})
		.from(tenders)
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(
			and(
				eq(tenders.status, "open"),
				isNotNull(tenders.deadlineAt),
				lt(tenders.deadlineAt, new Date()),
			),
		)
		.orderBy(desc(tenders.deadlineAt))
		.limit(100);
}

export async function selectUnverifiedUsers(db: GreenShiftDb) {
	return db
		.select()
		.from(users)
		.where(
			and(
				inArray(users.role, ["business", "vendor"]),
				isNull(users.verifiedAt),
			),
		)
		.orderBy(desc(users.createdAt))
		.limit(100);
}

export async function selectVendorsWithoutProfile(db: GreenShiftDb) {
	return db
		.select({ user: users })
		.from(users)
		.leftJoin(vendors, eq(vendors.userId, users.id))
		.where(and(eq(users.role, "vendor"), isNull(vendors.id)))
		.limit(100);
}

export async function selectProjectsWithoutMrv(db: GreenShiftDb) {
	return db
		.select({ project: projects })
		.from(projects)
		.leftJoin(emissionReports, eq(emissionReports.projectId, projects.id))
		.where(
			and(
				inArray(projects.status, ["funding", "monitoring"]),
				isNull(emissionReports.id),
			),
		)
		.orderBy(desc(projects.createdAt))
		.limit(100);
}
