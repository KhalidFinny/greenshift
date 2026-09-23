import { and, asc, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	blueprints,
	organizationName,
	projects,
	proposals,
	tenders,
	users,
	vendorAssignments,
	vendorMatchScores,
} from "../../../db/schema";

// Every project that currently has a tender, open tenders first. The matching
// model's score for the calling vendor rides along, so the list ranks without a second request.
export async function listProjectTenders(
	db: GreenShiftDb,
	vendorId: number,
	tenderStatus: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			project: projects,
			companyName: organizationName,
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
		.leftJoin(vendorAssignments, eq(vendorAssignments.projectId, projects.id))
		.$dynamic();
	// Open bidding is open to every verified vendor. Closed bidding and direct
	// selection are private to the vendors the project was opened for.
	query.where(
		and(
			...(tenderStatus ? [eq(tenders.status, tenderStatus)] : []),
			or(
				eq(tenders.method, "open"),
				and(
					eq(tenders.method, "closed"),
					or(
						isNotNull(vendorMatchScores.id),
						eq(vendorAssignments.vendorId, vendorId),
					),
				),
				and(
					eq(tenders.method, "direct"),
					eq(vendorAssignments.vendorId, vendorId),
				),
			),
		),
	);
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
			companyName: organizationName,
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
