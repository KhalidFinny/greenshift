import { and, eq } from "drizzle-orm";
import type { BusinessTenderStatus } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	projects,
	proposals,
	tenders,
	vendorAssignments,
	vendorMatchScores,
	vendors,
} from "../../../db/schema";

// Each project's tender state and awarded vendor, so the list needs no request per row.
export async function listTenderOutcomes(db: GreenShiftDb, companyId: number) {
	const rows = await db
		.select({
			projectId: tenders.projectId,
			status: tenders.status,
			vendorName: vendors.companyName,
		})
		.from(tenders)
		.innerJoin(projects, eq(projects.id, tenders.projectId))
		.leftJoin(proposals, eq(proposals.id, tenders.awardedProposalId))
		.leftJoin(vendors, eq(vendors.id, proposals.vendorId))
		.where(eq(projects.companyId, companyId));

	return new Map(
		rows.map((row) => [
			row.projectId,
			{
				status: row.status as BusinessTenderStatus,
				vendorName: row.vendorName ?? null,
			},
		]),
	);
}

/** One project's choice, scoped through the project so a foreign row is absent. */
export async function findAssignment(
	db: GreenShiftDb,
	projectId: number,
	companyId: number,
) {
	const [row] = await db
		.select({
			projectId: vendorAssignments.projectId,
			vendorId: vendorAssignments.vendorId,
			vendorName: vendorAssignments.vendorName,
			method: vendorAssignments.method,
		})
		.from(vendorAssignments)
		.innerJoin(projects, eq(projects.id, vendorAssignments.projectId))
		.where(
			and(
				eq(vendorAssignments.projectId, projectId),
				eq(projects.companyId, companyId),
			),
		)
		.limit(1);

	return row ?? null;
}

export async function listScoredVendors(db: GreenShiftDb, projectId: number) {
	return db
		.select({ score: vendorMatchScores, profile: vendors })
		.from(vendorMatchScores)
		.innerJoin(vendors, eq(vendors.id, vendorMatchScores.vendorId))
		.where(eq(vendorMatchScores.projectId, projectId))
		.orderBy(vendorMatchScores.rank);
}

/** A scored vendor for this project, so a selection can never name a stranger. */
export async function findScoredVendor(
	db: GreenShiftDb,
	projectId: number,
	vendorId: number,
) {
	const [row] = await db
		.select({ vendorId: vendors.id, vendorName: vendors.companyName })
		.from(vendorMatchScores)
		.innerJoin(vendors, eq(vendors.id, vendorMatchScores.vendorId))
		.where(
			and(
				eq(vendorMatchScores.projectId, projectId),
				eq(vendorMatchScores.vendorId, vendorId),
			),
		)
		.limit(1);

	return row ?? null;
}

// One row per project: a second save replaces the first, before the tender opens.
export async function upsertAssignment(
	db: GreenShiftDb,
	values: {
		projectId: number;
		vendorId: number;
		vendorName: string;
		method: (typeof vendorAssignments.$inferInsert)["method"];
	},
) {
	const [row] = await db
		.insert(vendorAssignments)
		.values(values)
		.onConflictDoUpdate({
			target: vendorAssignments.projectId,
			set: {
				vendorId: values.vendorId,
				vendorName: values.vendorName,
				method: values.method,
				updatedAt: new Date(),
			},
		})
		.returning();

	return row;
}
