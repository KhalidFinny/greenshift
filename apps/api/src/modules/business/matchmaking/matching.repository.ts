import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	projects,
	proposals,
	tenders,
	vendorMatchScores,
	vendors,
} from "../../../db/schema";
import type { MATCH_WEIGHTS } from "./scoring";

export type ScoreCriteria = Record<keyof typeof MATCH_WEIGHTS, number>;

/** The project fields the run scores from. */
export async function findProjectForMatching(
	db: GreenShiftDb,
	projectId: number,
) {
	const [row] = await db
		.select({
			id: projects.id,
			title: projects.title,
			description: projects.description,
			location: projects.location,
			industrySector: projects.industrySector,
			technicalRequirements: projects.technicalRequirements,
			riskScore: projects.riskScore,
		})
		.from(projects)
		.where(eq(projects.id, projectId))
		.limit(1);

	return row ?? null;
}

/** The vendors that can actually bid: a verified profile. */
export async function listVerifiedVendors(db: GreenShiftDb) {
	return db
		.select({
			id: vendors.id,
			companyName: vendors.companyName,
			description: vendors.description,
			serviceCategory: vendors.serviceCategory,
			location: vendors.location,
			certifications: vendors.certifications,
			portfolio: vendors.portfolio,
			rating: vendors.rating,
			totalProjects: vendors.totalProjects,
		})
		.from(vendors)
		.where(isNotNull(vendors.verifiedAt));
}

// Each vendor's share of past bids made in one sector, 0-100; a vendor with no bids is absent.
export async function sectorShareByVendor(
	db: GreenShiftDb,
	sector: string,
): Promise<Map<number, number>> {
	const rows = await db
		.select({
			vendorId: proposals.vendorId,
			share: sql<number>`avg(case when ${projects.industrySector} = ${sector} then 100.0 else 0.0 end)`,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.groupBy(proposals.vendorId);

	return new Map(
		rows.flatMap((row) =>
			typeof row.share === "number" && Number.isFinite(row.share)
				? [[row.vendorId, row.share] as const]
				: [],
		),
	);
}

// Each vendor's mean bid as a share of the budget it was made against; no bids, no row.
export async function meanBidShareByVendor(
	db: GreenShiftDb,
): Promise<Map<number, number>> {
	const rows = await db
		.select({
			vendorId: proposals.vendorId,
			share: sql<number>`avg(${proposals.amount} / ${projects.budget})`,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(sql`${projects.budget} is not null and ${projects.budget} > 0`)
		.groupBy(proposals.vendorId);

	return new Map(
		rows.flatMap((row) =>
			typeof row.share === "number" && Number.isFinite(row.share)
				? [[row.vendorId, row.share] as const]
				: [],
		),
	);
}

// Replaces whatever the project held, so a re-run cannot leave a half-ranked pool behind.
export async function replaceProjectScores(
	db: GreenShiftDb,
	projectId: number,
	rows: Array<{
		vendorId: number;
		criteria: ScoreCriteria;
		total: number;
		rank: number;
	}>,
): Promise<void> {
	await db
		.delete(vendorMatchScores)
		.where(eq(vendorMatchScores.projectId, projectId));

	if (rows.length === 0) return;

	await db.insert(vendorMatchScores).values(
		rows.map((row) => ({
			projectId,
			vendorId: row.vendorId,
			technicalFit: row.criteria.technicalFit,
			relevantExperience: row.criteria.relevantExperience,
			historicalPerformance: row.criteria.historicalPerformance,
			priceValue: row.criteria.priceValue,
			projectRisk: row.criteria.projectRisk,
			totalScore: row.total,
			rank: row.rank,
		})),
	);
}

/** The vendor ids the shortlist holds, best first: who a closed tender invites. */
export async function listShortlistVendorIds(
	db: GreenShiftDb,
	projectId: number,
	limit: number,
): Promise<number[]> {
	const rows = await db
		.select({ vendorId: vendorMatchScores.vendorId })
		.from(vendorMatchScores)
		.where(
			and(
				eq(vendorMatchScores.projectId, projectId),
				isNotNull(vendorMatchScores.rank),
			),
		)
		.orderBy(vendorMatchScores.rank);

	return rows.slice(0, limit).map((row) => row.vendorId);
}

export async function countProjectScores(
	db: GreenShiftDb,
	projectId: number,
): Promise<number> {
	const rows = await db
		.select({ id: vendorMatchScores.id })
		.from(vendorMatchScores)
		.where(eq(vendorMatchScores.projectId, projectId));

	return rows.length;
}

/** Which of these vendors a project has already ranked, for the invitation check. */
export async function listScoredVendorIds(
	db: GreenShiftDb,
	projectId: number,
	vendorIds: number[],
): Promise<number[]> {
	if (vendorIds.length === 0) return [];
	const rows = await db
		.select({ vendorId: vendorMatchScores.vendorId })
		.from(vendorMatchScores)
		.where(
			and(
				eq(vendorMatchScores.projectId, projectId),
				inArray(vendorMatchScores.vendorId, vendorIds),
			),
		);

	return rows.map((row) => row.vendorId);
}
