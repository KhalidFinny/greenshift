// The company's tender: closing bidding on it and awarding it to one bid.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { bidRoutes } from "./bid.routes";
import { awardBid, closeBidding, readTender } from "./procurement.service";

const factory = createFactory<ApiEnv>();

export const procurementRoutes = new Hono<ApiEnv>();

function projectId(c: { req: { param: (key: string) => string | undefined } }) {
	const raw = c.req.param("projectId");
	return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

// Bidding ends when the company says so, not when the clock runs out: a passed deadline still needs its bids read.
procurementRoutes.patch(
	"/procurement/:projectId/tender",
	mutationRateLimit("business", "procurement"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const body = (await c.req.json().catch(() => null)) as {
			action?: unknown;
		} | null;
		if (body?.action !== "close") {
			return apiError(c, "VALIDATION", "Send action: close to end bidding.", {
				fields: { action: "Send action: close to end bidding." },
			});
		}

		const db = createDb(c.env.DB);
		const companyId = c.get("user").id;
		const result = await closeBidding(db, companyId, id);
		// A tender that is not this company's is reported as missing, so the id cannot be probed.
		if (result.outcome === "not_found") return apiNotFound(c, "Tender");
		if (result.outcome === "not_open") {
			return apiError(
				c,
				"TENDER_CLOSED",
				"Bidding on this project's tender is not open.",
			);
		}

		const read = await readTender(db, companyId, id);
		return apiSuccess(
			c,
			{ tender: read?.tender ?? null },
			"Bidding closed. The bids are under evaluation.",
		);
	}),
);

procurementRoutes.post(
	"/procurement/:projectId/award",
	mutationRateLimit("business", "procurement"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const body = (await c.req.json().catch(() => null)) as {
			proposalId?: unknown;
		} | null;
		const proposalId = Number(body?.proposalId);
		if (!Number.isInteger(proposalId) || proposalId <= 0) {
			return apiError(c, "VALIDATION", "Choose the bid to award.", {
				fields: { proposalId: "Choose the bid to award." },
			});
		}

		const db = createDb(c.env.DB);
		const companyId = c.get("user").id;
		const result = await awardBid(db, companyId, id, proposalId);
		if (result.outcome === "not_found") return apiNotFound(c, "Bid");
		if (result.outcome === "already_awarded") {
			return apiError(
				c,
				"INVALID_STATE",
				"This tender has already been awarded.",
			);
		}
		if (result.outcome === "tender_open") {
			return apiError(
				c,
				"INVALID_TRANSITION",
				"Close bidding before awarding this tender.",
			);
		}
		if (result.outcome === "revision_open") {
			return apiError(
				c,
				"INVALID_STATE",
				"This bid is still being revised. The vendor has to answer the open round, or you reject the bid, before it can be awarded.",
			);
		}

		const read = await readTender(db, companyId, id);
		return apiSuccess(
			c,
			{ tender: read?.tender ?? null },
			`${read?.tender.awardedVendorName ?? "The winning vendor"} won this tender.`,
		);
	}),
);

procurementRoutes.route("/", bidRoutes);
