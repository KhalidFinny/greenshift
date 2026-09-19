import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	projects,
	proposals,
	tenders,
	users,
	vendorMatchScores,
} from "../../../db/schema";

// Every project that currently has a tender, open tenders first. The matching
// model's score for the calling vendor rides along, so the list can rank and
// explain each opportunity without a second request.
export async function listProjectTenders(
	db: GreenShiftDb,
	vendorId: number,
	tenderStatus: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			project: projects,
			companyName: users.name,
			tender: tenders,
			myProposalId: proposals.id,
			matchScore: vendorMatchScores,
		})
		.from(tenders)
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.leftJoin(
			proposals,
			and(eq(proposals.tenderId, tenders.id), eq(proposals.vendorId, vendorId)),
		)
		.leftJoin(
			vendorMatchScores,
			and(
				eq(vendorMatchScores.projectId, projects.id),
				eq(vendorMatchScores.vendorId, vendorId),
			),
		)
		.$dynamic();
	if (tenderStatus) {
		query.where(eq(tenders.status, tenderStatus));
	}
	query
		.orderBy(
			sql`case when ${tenders.status} = 'open' then 0 else 1 end`,
			asc(tenders.deadlineAt),
			asc(tenders.id),
		)
		.limit(limit);

	return query;
}

export async function findProjectRow(db: GreenShiftDb, id: number) {
	const [row] = await db
		.select({
			project: projects,
			companyName: users.name,
			tender: tenders,
			blueprint: blueprints,
		})
		.from(projects)
		.innerJoin(users, eq(projects.companyId, users.id))
		.leftJoin(tenders, eq(tenders.projectId, projects.id))
		.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
		.where(eq(projects.id, id))
		.orderBy(desc(blueprints.id))
		.limit(1);

	return row;
}

export async function findProposalIdForTender(
	db: GreenShiftDb,
	tenderId: number,
	vendorId: number,
) {
	const [existing] = await db
		.select({ id: proposals.id })
		.from(proposals)
		.where(
			and(eq(proposals.tenderId, tenderId), eq(proposals.vendorId, vendorId)),
		)
		.limit(1);

	return existing;
}
