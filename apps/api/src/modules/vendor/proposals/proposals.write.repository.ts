import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, proposals, tenders } from "../../../db/schema";

// Atomic: the INSERT ... SELECT re-checks the tender and a duplicate bid is a no-op, so Drizzle needs every column mirrored in order.
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
