// Reviewing one bid, and reading the written case the vendor filed with it.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { readAnnotations } from "../../../lib/annotations";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { readProjectProposalDocument } from "../../vendor/proposals/proposals.service";
import { reviewBid } from "./bid-review.service";

const factory = createFactory<ApiEnv>();

export const bidRoutes = new Hono<ApiEnv>();

function projectId(c: { req: { param: (key: string) => string | undefined } }) {
	const raw = c.req.param("projectId");
	return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

bidRoutes.post(
	"/procurement/:projectId/proposals/:proposalId/review",
	mutationRateLimit("business", "procurement"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		const proposalId = Number(c.req.param("proposalId"));
		if (id === null) return apiError(c, "INVALID_ID");
		if (!Number.isInteger(proposalId) || proposalId <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const body = (await c.req.json().catch(() => null)) as {
			decision?: unknown;
			note?: unknown;
			annotations?: unknown;
		} | null;
		const decision = body?.decision;
		if (decision !== "revision" && decision !== "reject") {
			return apiError(c, "VALIDATION", "Send a decision: revision or reject.", {
				fields: { decision: "Send a decision: revision or reject." },
			});
		}
		const note = typeof body?.note === "string" ? body.note : null;
		// Reading the marks here means a malformed one never reaches the store the vendor draws from.
		const annotations = readAnnotations(body?.annotations);

		const db = createDb(c.env.DB);
		const result = await reviewBid(db, c.get("user").id, id, proposalId, {
			decision,
			note,
			annotations,
		});

		if (result.outcome === "not_found") return apiNotFound(c, "Bid");
		if (result.outcome === "revision_note_required") {
			return apiError(
				c,
				"VALIDATION",
				"Say what the vendor should change before resubmitting.",
				{
					fields: {
						note: "Say what the vendor should change before resubmitting.",
					},
				},
			);
		}
		if (result.outcome === "revision_limit_reached") {
			return apiError(
				c,
				"REVISION_LIMIT",
				"This bid has used all three revision rounds. Accept or reject it.",
			);
		}
		if (result.outcome === "revision_pending") {
			return apiError(
				c,
				"INVALID_STATE",
				"This bid already has an open revision round. Wait for the vendor's answer, or reject the bid.",
			);
		}

		const message =
			decision === "reject"
				? "Bid rejected."
				: `Revision round ${result.iteration} opened; the vendor has been asked to revise.`;

		return apiSuccess(
			c,
			{ status: result.proposal.status, iteration: result.iteration },
			message,
		);
	}),
);

// The bidder's written case is readable on the company's side of its own tender, and by nobody else.
bidRoutes.get(
	"/procurement/:projectId/proposals/:proposalId/document",
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		const proposalId = Number(c.req.param("proposalId"));
		if (id === null) return apiError(c, "INVALID_ID");
		if (!Number.isInteger(proposalId) || proposalId <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await readProjectProposalDocument(db, c.env, id, proposalId);
		if (result.outcome === "not_found") return apiNotFound(c, "Document");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
