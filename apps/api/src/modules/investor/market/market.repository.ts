import { desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	brokerAssignments,
	investments,
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
			document: blueprints.document,
			publishedAt: blueprints.publishedAt,
		})
		.from(blueprints)
		.where(eq(blueprints.status, "published"))
		.orderBy(desc(blueprints.id));
}

export async function listFundedByProject(db: GreenShiftDb) {
	return db
		.select({
			projectId: investments.projectId,
			funded: sql<number>`coalesce(sum(case when ${investments.status} = 'active' then ${investments.amount} else 0 end), 0)`,
		})
		.from(investments)
		.groupBy(investments.projectId);
}

/**
 * Bond codes that have actually been issued, keyed by project. A bond with no
 * assignment or no serial has not been issued yet, so it carries no code.
 */
export async function listIssuedBondCodes(db: GreenShiftDb) {
	return db
		.select({
			projectId: brokerAssignments.projectId,
			serial: brokerAssignments.bondSerialNumber,
		})
		.from(brokerAssignments)
		.where(isNotNull(brokerAssignments.bondSerialNumber));
}
