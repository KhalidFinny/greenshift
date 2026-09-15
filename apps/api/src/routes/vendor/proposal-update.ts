import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalUpdateBody } from "../../contracts";
import { createDb } from "../../db";
import {
	auditLogs,
	proposalRevisions,
	proposals,
	tenders,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import {
	getProposalDetail,
	invalidNumber,
	MAX_SPEC_LENGTH,
	MAX_WARRANTY_MONTHS,
	mutationRateLimit,
} from "./helpers";

const factory = createFactory<ApiEnv>();

export const proposalUpdateRoutes = new Hono<ApiEnv>();

const MAX_REVISIONS = 3;
const MAX_NOTE_LENGTH = 2000;

// Update own proposal: free edit while "submitted", or respond to a revision
// request while "revision" (revisionCount++, revision trail, back to submitted).
proposalUpdateRoutes.patch(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "proposal");
		if (rateError) return rateError;

		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "ID tidak valid" } },
				400,
			);
		}

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<ProposalUpdateBody> | null;
		const amount = body?.amount;
		const technicalSpec = body?.technicalSpec;
		const operationalCost = body?.operationalCost;
		const projectedRoi = body?.projectedRoi;
		const warrantyPeriod = body?.warrantyPeriod;
		const note = body?.note;

		const hasFieldUpdate =
			amount !== undefined ||
			technicalSpec !== undefined ||
			operationalCost !== undefined ||
			projectedRoi !== undefined ||
			warrantyPeriod !== undefined;

		if (
			!hasFieldUpdate ||
			(amount !== undefined && (invalidNumber(amount) || amount <= 0)) ||
			(technicalSpec !== undefined &&
				(typeof technicalSpec !== "string" ||
					technicalSpec.length > MAX_SPEC_LENGTH)) ||
			invalidNumber(operationalCost, { min: 0 }) ||
			invalidNumber(projectedRoi, { min: 0 }) ||
			invalidNumber(warrantyPeriod, {
				integer: true,
				min: 1,
				max: MAX_WARRANTY_MONTHS,
			}) ||
			(note !== undefined &&
				(typeof note !== "string" || note.length > MAX_NOTE_LENGTH))
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;

		const [profile] = await db
			.select({ id: vendors.id, verifiedAt: vendors.verifiedAt })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
				404,
			);
		}
		if (!profile.verifiedAt) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Profil vendor belum diverifikasi oleh admin",
					},
				},
				403,
			);
		}

		const [currentRow] = await db
			.select({ proposal: proposals, tender: tenders })
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.where(and(eq(proposals.id, id), eq(proposals.vendorId, profile.id)))
			.limit(1);
		if (!currentRow) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
				404,
			);
		}
		const current = currentRow.proposal;

		if (
			current.status === "reviewed" ||
			current.status === "accepted" ||
			current.status === "rejected"
		) {
			return c.json(
				{
					error: {
						code: "PROPOSAL_LOCKED",
						message: "Penawaran sudah diproses dan tidak dapat diubah",
					},
				},
				409,
			);
		}

		const patch: Partial<typeof proposals.$inferInsert> = {};
		if (amount !== undefined) patch.amount = amount;
		if (technicalSpec !== undefined) patch.technicalSpec = technicalSpec;
		if (operationalCost !== undefined) patch.operationalCost = operationalCost;
		if (projectedRoi !== undefined) patch.projectedRoi = projectedRoi;
		if (warrantyPeriod !== undefined) patch.warrantyPeriod = warrantyPeriod;

		const isRevisionResponse = current.status === "revision";

		let updated: typeof proposals.$inferSelect | undefined;
		if (isRevisionResponse) {
			if ((current.revisionCount ?? 0) >= MAX_REVISIONS) {
				return c.json(
					{
						error: {
							code: "REVISION_LIMIT",
							message: `Batas revisi (${MAX_REVISIONS}) sudah tercapai`,
						},
					},
					409,
				);
			}
			// Atomic gate: the status + revision cap are re-checked inside the
			// UPDATE ... WHERE, so concurrent responses cannot double-claim the
			// next revision slot. The pre-check above only provides nicer errors.
			const [claimed] = await db
				.update(proposals)
				.set({
					...patch,
					status: "submitted",
					revisionCount: sql`${proposals.revisionCount} + 1`,
					submittedAt: new Date(),
				})
				.where(
					and(
						eq(proposals.id, current.id),
						eq(proposals.status, "revision"),
						sql`${proposals.revisionCount} < ${MAX_REVISIONS}`,
					),
				)
				.returning();
			if (!claimed) {
				return c.json(
					{
						error: {
							code: "REVISION_LIMIT",
							message: `Batas revisi (${MAX_REVISIONS}) tercapai atau penawaran sudah direspons`,
						},
					},
					409,
				);
			}
			await db.insert(proposalRevisions).values({
				proposalId: current.id,
				revisionNumber: claimed.revisionCount ?? 0,
				note: note ?? null,
				amount: amount ?? current.amount,
				previousAmount: current.amount,
				createdBy: "vendor",
			});
			updated = claimed;
		} else {
			const [row] = await db
				.update(proposals)
				.set(patch)
				.where(eq(proposals.id, current.id))
				.returning();
			if (!row) {
				return c.json(
					{
						error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" },
					},
					404,
				);
			}
			updated = row;
		}

		await db.insert(auditLogs).values({
			userId,
			projectId: currentRow.tender.projectId,
			action: isRevisionResponse ? "proposal.revised" : "proposal.updated",
			entityType: "proposal",
			entityId: updated.id,
			metadata: {
				amount: updated.amount,
				revisionNumber: isRevisionResponse ? updated.revisionCount : undefined,
			},
		});

		const detail = await getProposalDetail(db, updated.id, profile.id);
		return c.json({ proposal: detail });
	}),
);
