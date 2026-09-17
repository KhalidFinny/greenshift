import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalDraftBody, ProposalSummary } from "../../contracts";
import { createDb } from "../../db";
import {
	auditLogs,
	projects,
	proposals,
	tenders,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import {
	getProposalDetail,
	invalidNumber,
	iso,
	MAX_SPEC_LENGTH,
	MAX_WARRANTY_MONTHS,
	mutationRateLimit,
	parseLimit,
} from "./helpers";

const factory = createFactory<ApiEnv>();

export const proposalsRoutes = new Hono<ApiEnv>();

function proposalSummary(
	p: typeof proposals.$inferSelect,
	project: { id: number; title: string },
	tender: { status: string; deadlineAt: Date | null },
): ProposalSummary {
	return {
		id: p.id,
		tenderId: p.tenderId,
		projectId: project.id,
		projectTitle: project.title,
		amount: p.amount,
		status: p.status,
		revisionCount: p.revisionCount ?? 0,
		submittedAt: iso(p.submittedAt),
		tenderStatus: tender.status,
		tenderDeadlineAt: iso(tender.deadlineAt),
	};
}

// ── proposals ─────────────────────────────────────────────
proposalsRoutes.get(
	"/proposals",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json({ proposals: [] });

		const rows = await db
			.select({
				proposal: proposals,
				tender: tenders,
				project: projects,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(eq(proposals.vendorId, profile.id))
			.orderBy(desc(proposals.submittedAt))
			.limit(limit);

		const list: ProposalSummary[] = rows.map(({ proposal, tender, project }) =>
			proposalSummary(proposal, project, tender),
		);
		return c.json({ proposals: list });
	}),
);

proposalsRoutes.get(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}

		const detail = await getProposalDetail(db, id, profile.id);
		if (!detail) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}
		return c.json({ proposal: detail });
	}),
);

proposalsRoutes.post(
	"/proposals",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "proposal");
		if (rateError) return rateError;

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<ProposalDraftBody> | null;
		const tenderId = body?.tenderId;
		const amount = body?.amount;
		const technicalSpec = body?.technicalSpec;
		const operationalCost = body?.operationalCost;
		const projectedRoi = body?.projectedRoi;
		const warrantyPeriod = body?.warrantyPeriod;

		if (
			typeof tenderId !== "number" ||
			!Number.isInteger(tenderId) ||
			tenderId <= 0 ||
			typeof amount !== "number" ||
			!Number.isFinite(amount) ||
			amount <= 0 ||
			(technicalSpec !== undefined &&
				(typeof technicalSpec !== "string" ||
					technicalSpec.length > MAX_SPEC_LENGTH)) ||
			invalidNumber(operationalCost, { min: 0 }) ||
			invalidNumber(projectedRoi, { min: 0 }) ||
			invalidNumber(warrantyPeriod, {
				integer: true,
				min: 1,
				max: MAX_WARRANTY_MONTHS,
			})
		) {
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid proposal input" },
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;

		const [profile] = await db
			.select()
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message:
							"Complete your vendor profile before submitting a proposal",
					},
				},
				400,
			);
		}
		if (!profile.verifiedAt) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Vendor profile has not been verified by an admin",
					},
				},
				403,
			);
		}

		const [tender] = await db
			.select()
			.from(tenders)
			.where(eq(tenders.id, tenderId))
			.limit(1);
		if (!tender) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Tender not found" } },
				404,
			);
		}
		if (tender.status !== "open") {
			return c.json(
				{ error: { code: "TENDER_CLOSED", message: "Tender already closed" } },
				409,
			);
		}
		if (tender.deadlineAt && tender.deadlineAt.getTime() < Date.now()) {
			return c.json(
				{
					error: {
						code: "TENDER_DEADLINE",
						message: "Tender deadline has passed",
					},
				},
				409,
			);
		}

		const [duplicate] = await db
			.select({ id: proposals.id })
			.from(proposals)
			.where(
				and(
					eq(proposals.tenderId, tenderId),
					eq(proposals.vendorId, profile.id),
				),
			)
			.limit(1);
		if (duplicate) {
			return c.json(
				{
					error: {
						code: "DUPLICATE_PROPOSAL",
						message: "You have already submitted a proposal for this tender",
					},
				},
				409,
			);
		}

		// Single atomic statement: the tender is re-checked (open + inside its
		// deadline) inside the INSERT ... SELECT, and the unique
		// (tender_id, vendor_id) index turns a duplicate bid into a no-op via
		// ON CONFLICT DO NOTHING. The pre-checks above only give nicer errors.
		// Drizzle requires the select to mirror every table column, in
		// declaration order; `id` is null so SQLite assigns the rowid.
		const now = new Date();
		const [inserted] = await db
			.insert(proposals)
			.select(
				db
					.select({
						id: sql<number | null>`null`.as("id"),
						tenderId: sql<number>`${tenderId}`.as("tender_id"),
						vendorId: sql<number>`${profile.id}`.as("vendor_id"),
						amount: sql<number>`${amount}`.as("amount"),
						technicalSpec: sql<string | null>`${technicalSpec ?? null}`.as(
							"technical_spec",
						),
						operationalCost: sql<number | null>`${operationalCost ?? null}`.as(
							"operational_cost",
						),
						projectedRoi: sql<number | null>`${projectedRoi ?? null}`.as(
							"projected_roi",
						),
						warrantyPeriod: sql<number | null>`${warrantyPeriod ?? null}`.as(
							"warranty_period",
						),
						status: sql<string>`'submitted'`.as("status"),
						revisionCount: sql<number>`0`.as("revision_count"),
						submittedAt: sql<number>`${now.getTime()}`.as("submitted_at"),
						reviewedAt: sql<number | null>`null`.as("reviewed_at"),
						createdAt: sql<number>`${now.getTime()}`.as("created_at"),
						updatedAt: sql<number>`${now.getTime()}`.as("updated_at"),
					})
					.from(tenders)
					.where(
						and(
							eq(tenders.id, tenderId),
							eq(tenders.status, "open"),
							or(isNull(tenders.deadlineAt), gte(tenders.deadlineAt, now)),
						),
					),
			)
			.onConflictDoNothing({
				target: [proposals.tenderId, proposals.vendorId],
			})
			.returning({ id: proposals.id });

		if (!inserted) {
			return c.json(
				{
					error: {
						code: "PROPOSAL_CONFLICT",
						message:
							"Proposal could not be submitted: the tender is closed or a proposal already exists",
					},
				},
				409,
			);
		}

		await db.insert(auditLogs).values({
			userId,
			projectId: tender.projectId,
			action: "proposal.submitted",
			entityType: "proposal",
			entityId: inserted.id,
			metadata: { amount, tenderId },
		});

		const [row] = await db
			.select({
				proposal: proposals,
				tender: tenders,
				project: projects,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(eq(proposals.id, inserted.id))
			.limit(1);
		if (!row) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to load proposal" } },
				500,
			);
		}

		return c.json(
			{ proposal: proposalSummary(row.proposal, row.project, row.tender) },
			201,
		);
	}),
);

// Withdraw: allowed only while the proposal is still queued for review.
proposalsRoutes.delete(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}

		const [row] = await db
			.select({ proposal: proposals, tender: tenders })
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.where(and(eq(proposals.id, id), eq(proposals.vendorId, profile.id)))
			.limit(1);
		if (!row) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}

		if (row.proposal.status !== "submitted") {
			return c.json(
				{
					error: {
						code: "PROPOSAL_LOCKED",
						message:
							"Only proposals that have not yet been processed can be withdrawn",
					},
				},
				409,
			);
		}

		await db.batch([
			db.delete(proposals).where(eq(proposals.id, id)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				projectId: row.tender.projectId,
				action: "proposal.withdrawn",
				entityType: "proposal",
				entityId: id,
				metadata: { amount: row.proposal.amount },
			}),
		]);
		return c.json({ ok: true });
	}),
);
