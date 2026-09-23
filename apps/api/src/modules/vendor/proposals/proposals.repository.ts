import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { projects, proposals, tenders, vendors } from "../../../db/schema";

/** The vendor's proposals, newest first, with tender + project context. */
export async function listProposalRows(
	db: GreenShiftDb,
	vendorId: number,
	limit: number,
) {
	return db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(eq(proposals.vendorId, vendorId))
		.orderBy(desc(proposals.submittedAt))
		.limit(limit);
}

export async function findVendorByUser(db: GreenShiftDb, userId: number) {
	const [profile] = await db
		.select()
		.from(vendors)
		.where(eq(vendors.userId, userId))
		.limit(1);

	return profile;
}

export async function findTenderById(db: GreenShiftDb, tenderId: number) {
	const [tender] = await db
		.select()
		.from(tenders)
		.where(eq(tenders.id, tenderId))
		.limit(1);

	return tender;
}

export async function findProposalIdByTenderVendor(
	db: GreenShiftDb,
	tenderId: number,
	vendorId: number,
) {
	const [duplicate] = await db
		.select({ id: proposals.id })
		.from(proposals)
		.where(
			and(eq(proposals.tenderId, tenderId), eq(proposals.vendorId, vendorId)),
		)
		.limit(1);

	return duplicate;
}

export async function findProposalSummaryRow(
	db: GreenShiftDb,
	proposalId: number,
) {
	const [row] = await db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(eq(proposals.id, proposalId))
		.limit(1);

	return row;
}

export async function findProposalWithTender(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
) {
	const [row] = await db
		.select({ proposal: proposals, tender: tenders })
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.limit(1);

	return row;
}

/** One proposal's filed document, scoped to the vendor that owns it. */
export async function findVendorProposalDocument(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
) {
	const [row] = await db
		.select({
			documentName: proposals.documentName,
			documentKey: proposals.documentKey,
		})
		.from(proposals)
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.limit(1);

	return row ?? null;
}

/** Scoped to a company: the proposal must sit on a tender of one of its projects. */
export async function findProjectProposalDocument(
	db: GreenShiftDb,
	proposalId: number,
	projectId: number,
) {
	const [row] = await db
		.select({
			documentName: proposals.documentName,
			documentKey: proposals.documentKey,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.where(and(eq(proposals.id, proposalId), eq(tenders.projectId, projectId)))
		.limit(1);

	return row ?? null;
}
