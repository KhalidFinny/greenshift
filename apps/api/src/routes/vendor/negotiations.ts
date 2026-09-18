import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	VendorNegotiation,
	VendorNegotiationResponseBody,
} from "../../contracts";
import { createDb } from "../../db";
import {
	auditLogs,
	maxNegotiationIterations,
	negotiations,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import { invalidNumber, iso, mutationRateLimit } from "./helpers";

const factory = createFactory<ApiEnv>();

export const negotiationRoutes = new Hono<ApiEnv>();

const MAX_NOTE_LENGTH = 2000;

type NegotiationRow = {
	negotiation: typeof negotiations.$inferSelect;
	projectTitle: string;
	companyName: string | null;
	projectId: number;
};

function toNegotiation(row: NegotiationRow): VendorNegotiation {
	const n = row.negotiation;
	return {
		id: n.id,
		proposalId: n.proposalId,
		projectId: row.projectId,
		projectTitle: row.projectTitle,
		companyName: row.companyName,
		iterationNumber: n.iterationNumber,
		maxIterations: maxNegotiationIterations,
		status: n.status,
		requestedPriceReduction: n.requestedPriceReduction,
		requestedWarrantyYears: n.requestedWarrantyYears,
		requestedTimelineMonths: n.requestedTimelineMonths,
		requestedFields: n.requestedFields ?? [],
		companyNote: n.companyNote,
		vendorRevisedPrice: n.vendorRevisedPrice,
		vendorRevisedWarrantyYears: n.vendorRevisedWarrantyYears,
		vendorRevisedTimelineMonths: n.vendorRevisedTimelineMonths,
		vendorResponseNote: n.vendorResponseNote,
		respondedAt: iso(n.respondedAt),
		updatedAt: n.updatedAt.toISOString(),
	};
}

// Owner-scoped negotiation rows with the project/company they belong to.
function negotiationSelection() {
	return {
		negotiation: negotiations,
		projectTitle: projects.title,
		companyName: users.name,
		projectId: projects.id,
	};
}

// ── negotiations ──────────────────────────────────────────
negotiationRoutes.get(
	"/negotiations",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json({ negotiations: [] });

		const rows = await db
			.select(negotiationSelection())
			.from(negotiations)
			.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(eq(proposals.vendorId, profile.id))
			.orderBy(desc(negotiations.updatedAt));

		return c.json({ negotiations: rows.map(toNegotiation) });
	}),
);

// Answer a company revision request: stores the vendor's counter-offer on the
// negotiation, appends a vendor entry to the proposal revision trail and puts
// the proposal back in review.
negotiationRoutes.post(
	"/negotiations/:id/response",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "negotiation");
		if (rateError) return rateError;

		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const body = (await c.req
			.json()
			.catch(() => null)) as VendorNegotiationResponseBody | null;
		const revisedPrice = body?.revisedPrice;
		const revisedWarrantyYears = body?.revisedWarrantyYears;
		const revisedTimelineMonths = body?.revisedTimelineMonths;
		const note = body?.note;

		if (
			invalidNumber(revisedPrice, { min: 0 }) ||
			invalidNumber(revisedWarrantyYears, {
				integer: true,
				min: 0,
				max: 50,
			}) ||
			invalidNumber(revisedTimelineMonths, {
				integer: true,
				min: 0,
				max: 120,
			}) ||
			(note !== undefined &&
				(typeof note !== "string" || note.length > MAX_NOTE_LENGTH))
		) {
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid negotiation input" },
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Negotiation not found" } },
				404,
			);
		}

		const [row] = await db
			.select({
				negotiation: negotiations,
				proposal: proposals,
				projectId: projects.id,
			})
			.from(negotiations)
			.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(and(eq(negotiations.id, id), eq(proposals.vendorId, profile.id)))
			.limit(1);

		if (!row) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Negotiation not found" } },
				404,
			);
		}
		if (row.negotiation.status !== "PENDING_VENDOR_RESPONSE") {
			return c.json(
				{
					error: {
						code: "INVALID_STATE",
						message: "This negotiation has already been answered",
					},
				},
				409,
			);
		}

		const now = new Date();
		const previousAmount = row.proposal.amount;
		const nextAmount = revisedPrice ?? previousAmount;

		await db
			.update(negotiations)
			.set({
				status: "SUBMITTED_BY_VENDOR",
				vendorRevisedPrice: revisedPrice ?? null,
				vendorRevisedWarrantyYears: revisedWarrantyYears ?? null,
				vendorRevisedTimelineMonths: revisedTimelineMonths ?? null,
				vendorResponseNote: note ?? null,
				respondedAt: now,
			})
			.where(eq(negotiations.id, id));

		if (nextAmount !== previousAmount) {
			await db
				.update(proposals)
				.set({
					amount: nextAmount,
					status: "submitted",
					revisionCount: (row.proposal.revisionCount ?? 0) + 1,
				})
				.where(eq(proposals.id, row.proposal.id));

			await db.insert(proposalRevisions).values({
				proposalId: row.proposal.id,
				revisionNumber: (row.proposal.revisionCount ?? 0) + 1,
				note: note ?? null,
				amount: nextAmount,
				previousAmount,
				createdBy: "vendor",
			});
		}

		await db.insert(auditLogs).values({
			userId,
			projectId: row.projectId,
			action: "negotiation.responded",
			entityType: "negotiation",
			entityId: id,
			metadata: { revisedPrice: revisedPrice ?? null },
		});

		const [updated] = await db
			.select(negotiationSelection())
			.from(negotiations)
			.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(eq(negotiations.id, id))
			.limit(1);

		if (!updated) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to load negotiation" } },
				500,
			);
		}
		return c.json({ negotiation: toNegotiation(updated) });
	}),
);
