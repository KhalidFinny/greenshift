import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	VendorLeaderboardEntry,
	VendorLeaderboardResponse,
} from "../../contracts";
import { createDb } from "../../db";
import { projects, proposals, tenders, users, vendors } from "../../db/schema";
import type { ApiEnv } from "../../env";
import { iso } from "./helpers";

const factory = createFactory<ApiEnv>();

export const leaderboardRoutes = new Hono<ApiEnv>();

const EMPTY: VendorLeaderboardResponse = {
	tender: null,
	myProposalId: null,
	myAmount: null,
	myRank: null,
	entries: [],
};

/**
 * Ranking for the open-bid tender this vendor is currently bidding on: the
 * lowest amount leads, and the vendor's own row is flagged so the UI can show
 * "rank N of M".
 */
leaderboardRoutes.get(
	"/leaderboard",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json(EMPTY);

		// The vendor's open-bid tender with the nearest deadline.
		const [target] = await db
			.select({ tender: tenders, project: projects, proposal: proposals })
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(
				and(
					eq(proposals.vendorId, profile.id),
					eq(tenders.method, "open"),
					eq(tenders.status, "open"),
				),
			)
			.orderBy(asc(tenders.deadlineAt))
			.limit(1);

		if (!target) return c.json(EMPTY);

		const rows = await db
			.select({
				proposalId: proposals.id,
				vendorId: proposals.vendorId,
				amount: proposals.amount,
				vendorName: users.name,
				updatedAt: proposals.updatedAt,
			})
			.from(proposals)
			.innerJoin(vendors, eq(proposals.vendorId, vendors.id))
			.innerJoin(users, eq(vendors.userId, users.id))
			.where(eq(proposals.tenderId, target.tender.id))
			.orderBy(asc(proposals.amount), asc(proposals.id));

		const entries: VendorLeaderboardEntry[] = rows.map((row, index) => ({
			rank: index + 1,
			proposalId: row.proposalId,
			vendorName: row.vendorName,
			isCurrentVendor: row.vendorId === profile.id,
			amount: row.amount,
			updatedAt: row.updatedAt.toISOString(),
		}));

		const mine = entries.find((entry) => entry.isCurrentVendor) ?? null;

		return c.json({
			tender: {
				id: target.tender.id,
				projectId: target.project.id,
				projectTitle: target.project.title,
				method: target.tender.method,
				status: target.tender.status,
				deadlineAt: iso(target.tender.deadlineAt),
				budgetMax: target.tender.budgetMax,
			},
			myProposalId: mine?.proposalId ?? target.proposal.id,
			myAmount: mine?.amount ?? target.proposal.amount,
			myRank: mine?.rank ?? null,
			entries,
		} satisfies VendorLeaderboardResponse);
	}),
);
