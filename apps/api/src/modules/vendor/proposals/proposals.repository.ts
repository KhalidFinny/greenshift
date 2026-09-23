import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	auditLogs,
	projects,
	proposals,
	tenders,
	vendors,
} from "../../../db/schema";

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

// Single atomic statement: the tender is re-checked (open + inside its
// deadline) inside the INSERT ... SELECT, and the unique
// (tender_id, vendor_id) index turns a duplicate bid into a no-op via
// ON CONFLICT DO NOTHING. The service's pre-checks only give nicer errors.
// Drizzle requires the select to mirror every table column, in
// declaration order; `id` is null so SQLite assigns the rowid.
export async function insertProposalAtomically(
	db: GreenShiftDb,
	input: {
		tenderId: number;
		vendorId: number;
		amount: number;
		technicalSpec: string | null | undefined;
		operationalCost: number | null | undefined;
		projectedRoi: number | null | undefined;
		warrantyPeriod: number | null | undefined;
		/** The proposal document, already in R2: a bid is filed with its case. */
		documentName: string;
		documentKey: string;
	},
) {
	const now = new Date();
	const [inserted] = await db
		.insert(proposals)
		.select(
			db
				.select({
					id: sql<number | null>`null`.as("id"),
					tenderId: sql<number>`${input.tenderId}`.as("tender_id"),
					vendorId: sql<number>`${input.vendorId}`.as("vendor_id"),
					amount: sql<number>`${input.amount}`.as("amount"),
					technicalSpec: sql<string | null>`${input.technicalSpec ?? null}`.as(
						"technical_spec",
					),
					operationalCost: sql<
						number | null
					>`${input.operationalCost ?? null}`.as("operational_cost"),
					projectedRoi: sql<number | null>`${input.projectedRoi ?? null}`.as(
						"projected_roi",
					),
					warrantyPeriod: sql<
						number | null
					>`${input.warrantyPeriod ?? null}`.as("warranty_period"),
					status: sql<string>`'submitted'`.as("status"),
					revisionCount: sql<number>`0`.as("revision_count"),
					documentName: sql<string>`${input.documentName}`.as("document_name"),
					documentKey: sql<string>`${input.documentKey}`.as("document_key"),
					submittedAt: sql<number>`${now.getTime()}`.as("submitted_at"),
					reviewedAt: sql<number | null>`null`.as("reviewed_at"),
					createdAt: sql<number>`${now.getTime()}`.as("created_at"),
					updatedAt: sql<number>`${now.getTime()}`.as("updated_at"),
				})
				.from(tenders)
				.where(
					and(
						eq(tenders.id, input.tenderId),
						eq(tenders.status, "open"),
						or(isNull(tenders.deadlineAt), gte(tenders.deadlineAt, now)),
					),
				),
		)
		.onConflictDoNothing({
			target: [proposals.tenderId, proposals.vendorId],
		})
		.returning({ id: proposals.id });

	return inserted;
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

/** Files a document on one of the vendor's own proposals. */
export async function setProposalDocument(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
	values: { documentName: string; documentKey: string },
) {
	const [row] = await db
		.update(proposals)
		.set(values)
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.returning({
			documentName: proposals.documentName,
			documentKey: proposals.documentKey,
		});

	return row ?? null;
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

/**
 * One proposal's filed document, scoped to a company: the proposal has to sit
 * on a tender of one of that company's own projects, so a bid's document is not
 * readable by another company's account.
 */
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

/** Withdraw: allowed only while the proposal is still queued for review. */
export async function withdrawProposalWithAudit(
	db: GreenShiftDb,
	params: {
		proposalId: number;
		userId: number;
		projectId: number;
		amount: number;
	},
): Promise<void> {
	await db.batch([
		db.delete(proposals).where(eq(proposals.id, params.proposalId)),
		db.insert(auditLogs).values({
			userId: params.userId,
			projectId: params.projectId,
			action: "proposal.withdrawn",
			entityType: "proposal",
			entityId: params.proposalId,
			metadata: { amount: params.amount },
		}),
	]);
}
