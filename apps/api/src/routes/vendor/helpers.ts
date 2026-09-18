import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import type {
	ProposalDetail,
	ProposalRevisionEntry,
	VendorTenderSummary,
} from "../../contracts";
import type { GreenShiftDb } from "../../db";
import {
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { rateLimited } from "../../lib/http";
import { checkRateLimit, clientIp } from "../../lib/rate-limit";

// Caps shared by more than one vendor route file.
export const MAX_SPEC_LENGTH = 5000;
export const MAX_WARRANTY_MONTHS = 240;

export function iso(date: Date | null): string | null {
	return date?.toISOString() ?? null;
}

export function parseLimit(raw: string | undefined, fallback = 50, max = 200) {
	const n = Number(raw ?? fallback);
	return Math.min(
		Math.max(Number.isFinite(n) ? Math.trunc(n) : fallback, 1),
		max,
	);
}

export function invalidNumber(
	value: unknown,
	opts: { integer?: boolean; min?: number; max?: number } = {},
): boolean {
	if (value === undefined || value === null) return false;
	if (typeof value !== "number" || !Number.isFinite(value)) return true;
	if (opts.integer && !Number.isInteger(value)) return true;
	if (opts.min !== undefined && value < opts.min) return true;
	if (opts.max !== undefined && value > opts.max) return true;
	return false;
}

export function tenderSummary(
	t: typeof tenders.$inferSelect,
): VendorTenderSummary {
	return {
		id: t.id,
		method: t.method,
		status: t.status,
		budgetMin: t.budgetMin,
		budgetMax: t.budgetMax,
		deadlineAt: iso(t.deadlineAt),
		awardedProposalId: t.awardedProposalId,
	};
}

export function revisionEntry(
	r: typeof proposalRevisions.$inferSelect,
): ProposalRevisionEntry {
	return {
		id: r.id,
		revisionNumber: r.revisionNumber,
		note: r.note,
		amount: r.amount,
		previousAmount: r.previousAmount,
		createdBy: r.createdBy,
		createdAt: iso(r.createdAt),
	};
}

// Coarse throttle for vendor mutations, mirroring the investor bond guard.
export async function mutationRateLimit(
	c: Context<ApiEnv>,
	scope: string,
): Promise<Response | null> {
	const ip = clientIp(c.req.raw);
	const ipCheck = await checkRateLimit(
		c.env,
		`vendor:${scope}:ip:${ip}`,
		30,
		600,
	);
	if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);
	const userCheck = await checkRateLimit(
		c.env,
		`vendor:${scope}:user:${c.get("user").id}`,
		30,
		600,
	);
	if (!userCheck.ok) return rateLimited(c, userCheck.retryAfter);
	return null;
}

// Owner-scoped full proposal detail (proposal + tender + project + revisions).
export async function getProposalDetail(
	db: GreenShiftDb,
	proposalId: number,
	vendorId: number,
): Promise<ProposalDetail | null> {
	const [row] = await db
		.select({
			proposal: proposals,
			tender: tenders,
			project: projects,
			companyName: users.name,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(and(eq(proposals.id, proposalId), eq(proposals.vendorId, vendorId)))
		.limit(1);
	if (!row) return null;

	const revisions = await db
		.select()
		.from(proposalRevisions)
		.where(eq(proposalRevisions.proposalId, proposalId))
		.orderBy(proposalRevisions.revisionNumber);

	return {
		id: row.proposal.id,
		amount: row.proposal.amount,
		technicalSpec: row.proposal.technicalSpec,
		operationalCost: row.proposal.operationalCost,
		projectedRoi: row.proposal.projectedRoi,
		warrantyPeriod: row.proposal.warrantyPeriod,
		status: row.proposal.status,
		revisionCount: row.proposal.revisionCount ?? 0,
		submittedAt: iso(row.proposal.submittedAt),
		reviewedAt: iso(row.proposal.reviewedAt),
		tender: tenderSummary(row.tender),
		project: {
			id: row.project.id,
			title: row.project.title,
			description: row.project.description,
			status: row.project.status,
			companyName: row.companyName,
			location: row.project.location,
			industrySector: row.project.industrySector,
			budget: row.project.budget,
		},
		revisions: revisions.map(revisionEntry),
	};
}
