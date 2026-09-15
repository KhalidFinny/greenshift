import { and, desc, eq, sql } from "drizzle-orm";
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

// ── proposals (penawaran) ─────────────────────────────────
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
				{ error: { code: "VALIDATION", message: "ID tidak valid" } },
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
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
				404,
			);
		}

		const detail = await getProposalDetail(db, id, profile.id);
		if (!detail) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
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
					error: { code: "VALIDATION", message: "Input penawaran tidak valid" },
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
						message: "Lengkapi profil vendor sebelum mengirim penawaran",
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
						message: "Profil vendor belum diverifikasi oleh admin",
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
				{ error: { code: "NOT_FOUND", message: "Tender tidak ditemukan" } },
				404,
			);
		}
		if (tender.status !== "open") {
			return c.json(
				{ error: { code: "TENDER_CLOSED", message: "Tender sudah ditutup" } },
				409,
			);
		}
		if (tender.deadlineAt && tender.deadlineAt.getTime() < Date.now()) {
			return c.json(
				{
					error: {
						code: "TENDER_DEADLINE",
						message: "Tenggat tender sudah lewat",
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
						message: "Anda sudah mengirim penawaran untuk tender ini",
					},
				},
				409,
			);
		}

		// Single atomic statement: open + deadline + no-duplicate are re-checked
		// inside the INSERT ... SELECT WHERE, so concurrent submissions cannot
		// double-bid a tender. The pre-checks above only provide nicer errors.
		const now = new Date();
		const runResult = await db.run(sql`
			INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
			SELECT ${tenderId}, ${profile.id}, ${amount}, ${technicalSpec ?? null}, ${operationalCost ?? null}, ${projectedRoi ?? null}, ${warrantyPeriod ?? null}, 'submitted', 0, ${now.getTime()}, ${now.getTime()}, ${now.getTime()}
			WHERE EXISTS (
				SELECT 1 FROM tenders t
				WHERE t.id = ${tenderId}
					AND t.status = 'open'
					AND (t.deadline_at IS NULL OR t.deadline_at >= ${now.getTime()})
			)
			AND NOT EXISTS (
				SELECT 1 FROM proposals p WHERE p.tender_id = ${tenderId} AND p.vendor_id = ${profile.id}
			)
			RETURNING id
		`);
		const firstRow = runResult.results?.[0] as
			| Record<string, unknown>
			| undefined;
		const insertedId = Number(firstRow?.id);
		if (!Number.isInteger(insertedId) || insertedId <= 0) {
			return c.json(
				{
					error: {
						code: "PROPOSAL_CONFLICT",
						message:
							"Penawaran gagal dikirim: tender ditutup atau penawaran sudah ada",
					},
				},
				409,
			);
		}
		const inserted = { id: insertedId };

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
				{ error: { code: "INTERNAL", message: "Gagal memuat penawaran" } },
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
				{ error: { code: "VALIDATION", message: "ID tidak valid" } },
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
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
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
				{ error: { code: "NOT_FOUND", message: "Penawaran tidak ditemukan" } },
				404,
			);
		}

		if (row.proposal.status !== "submitted") {
			return c.json(
				{
					error: {
						code: "PROPOSAL_LOCKED",
						message: "Hanya penawaran yang belum diproses yang dapat ditarik",
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
