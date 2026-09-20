import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { runMatching } from "./matching.service";
import {
	listMatchmaking,
	readMatchmakingDetail,
	saveSelection,
} from "./matchmaking.service";

const factory = createFactory<ApiEnv>();

/** How each route reads in a sentence the toast can carry. */
const PROCUREMENT_LABEL: Record<string, string> = {
	open: "Open bidding",
	closed: "Closed bidding",
	direct: "Direct selection",
};

export const matchmakingRoutes = new Hono<ApiEnv>();

/** The path id is the project id, so it has the same shape check as everywhere. */
function projectId(c: { req: { param: (key: string) => string | undefined } }) {
	const raw = c.req.param("projectId");
	return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

// ── list ──────────────────────────────────────────────────
matchmakingRoutes.get(
	"/matchmaking",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const projects = await listMatchmaking(
			db,
			c.get("user").id,
			c.req.query("limit"),
		);

		return c.json({ projects });
	}),
);

// ── detail ────────────────────────────────────────────────
matchmakingRoutes.get(
	"/matchmaking/:projectId",
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const result = await readMatchmakingDetail(db, c.get("user").id, id);
		if (result.outcome === "not_found") return apiNotFound(c, "Project");

		return c.json(result.detail);
	}),
);

// ── matching run ──────────────────────────────────────────
// The pool moves as vendor profiles are verified, so the company can ask for the
// ranking again rather than living with the one its verification produced.
matchmakingRoutes.post(
	"/matchmaking/:projectId/matching",
	mutationRateLimit("business", "matching"),
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const project = await readMatchmakingDetail(db, c.get("user").id, id);
		if (project.outcome === "not_found") return apiNotFound(c, "Project");

		const result = await runMatching(db, id);
		if (result === null) return apiNotFound(c, "Project");

		return apiSuccess(
			c,
			{ scored: result.scored, shortlist: result.shortlist },
			result.scored === 0
				? "No verified vendor could be scored yet."
				: `Scored ${result.scored} verified vendor${result.scored === 1 ? "" : "s"}.`,
		);
	}),
);

// ── selection ─────────────────────────────────────────────
matchmakingRoutes.post(
	"/matchmaking/:projectId/selection",
	mutationRateLimit("business", "selection"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = projectId(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const body = (await c.req.json().catch(() => null)) as {
			vendorId?: unknown;
			method?: unknown;
			deadlineAt?: unknown;
			budgetMin?: unknown;
			budgetMax?: unknown;
		} | null;
		if (body === null || typeof body !== "object") {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await saveSelection(db, c.get("user").id, id, body);

		if (result.outcome === "not_found") return apiNotFound(c, "Project");
		if (result.outcome === "unknown_method") {
			return apiError(
				c,
				"VALIDATION",
				"Choose a procurement method to continue.",
				{ fields: { method: "Choose a procurement method to continue." } },
			);
		}
		if (result.outcome === "vendor_required") {
			return apiError(
				c,
				"VALIDATION",
				"The direct route appoints one vendor, so name it before opening the tender.",
				{
					fields: {
						vendorId:
							"The direct route appoints one vendor, so name it before opening the tender.",
					},
				},
			);
		}
		if (result.outcome === "unknown_vendor") {
			return apiError(
				c,
				"VALIDATION",
				"Choose one of the recommended vendors.",
				{ fields: { vendorId: "Choose one of the recommended vendors." } },
			);
		}
		if (result.outcome === "deadline_invalid") {
			return apiError(
				c,
				"VALIDATION",
				"Choose a bidding deadline between now and 90 days from now.",
				{
					fields: {
						deadlineAt:
							"Choose a bidding deadline between now and 90 days from now.",
					},
				},
			);
		}
		if (result.outcome === "tender_locked") {
			return apiError(
				c,
				"INVALID_STATE",
				`This project's tender is already ${result.status}. Bids on it were made against the terms it opened with.`,
			);
		}

		return apiSuccess(
			c,
			{
				selection: {
					projectId: id,
					vendorId: result.vendorId,
					vendorName: result.vendorName,
					method: result.method,
				},
				tender: result.tender,
			},
			`${
				result.vendorName
					? `${result.vendorName} is appointed, and`
					: `${PROCUREMENT_LABEL[result.method]} is open, and`
			} bidding runs until ${new Date(
				result.tender.deadlineAt ?? Date.now(),
			).toLocaleDateString("en-GB", { dateStyle: "medium" })}.`,
		);
	}),
);
