import { desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	brokerAssignments,
	emissionReports,
	projects,
	users,
} from "../../../db/schema";

export async function listProjectRows(db: GreenShiftDb) {
	return db
		.select({ project: projects, companyName: users.companyName })
		.from(projects)
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(ne(projects.status, "draft"))
		.orderBy(desc(projects.id));
}

export async function listPublishedBlueprints(db: GreenShiftDb) {
	return db
		.select({
			projectId: blueprints.projectId,
			status: blueprints.status,
			document: blueprints.document,
			validatedAt: blueprints.validatedAt,
			publishedAt: blueprints.publishedAt,
		})
		.from(blueprints)
		.where(eq(blueprints.status, "published"))
		.orderBy(desc(blueprints.id));
}

// Per project: verified tonnes, period count, latest period, and whether any
// period deviated from baseline. This is the figure the public listing reports.
export async function listEmissionMonitoring(db: GreenShiftDb) {
	return db
		.select({
			projectId: emissionReports.projectId,
			verifiedTco2: sql<number>`coalesce(sum(${emissionReports.emissionReduction}), 0)`,
			periods: sql<number>`count(*)`,
			latestPeriod: sql<number | null>`max(${emissionReports.periodStart})`,
			anomalyFlagged: sql<number>`max(case when ${emissionReports.anomalyFlagged} then 1 else 0 end)`,
		})
		.from(emissionReports)
		.where(isNotNull(emissionReports.emissionReduction))
		.groupBy(emissionReports.projectId);
}

// The bond terms the broker recorded for an issued bond, keyed by project. A
// project with no serial has not been issued, so it carries no terms.
export async function listIssuedBonds(db: GreenShiftDb) {
	return db
		.select({
			projectId: brokerAssignments.projectId,
			serial: brokerAssignments.bondSerialNumber,
			amount: brokerAssignments.bondAmount,
			tenorMonths: brokerAssignments.tenorMonths,
			couponRatePercent: brokerAssignments.couponRatePercent,
			issuanceDate: brokerAssignments.issuanceDate,
			maturityDate: brokerAssignments.maturityDate,
			status: brokerAssignments.bondStatus,
		})
		.from(brokerAssignments)
		.where(isNotNull(brokerAssignments.bondSerialNumber));
}
