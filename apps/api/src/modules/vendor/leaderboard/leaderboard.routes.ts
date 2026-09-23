import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { apiError } from "../../../lib/response";
import { getVendorLeaderboard } from "./leaderboard.service";

const factory = createFactory<ApiEnv>();

export const leaderboardRoutes = new Hono<ApiEnv>();

leaderboardRoutes.get(
	"/leaderboard",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		// A project screen names the tender it shows; the deals and tenders screens
		// leave it out and read the vendor's own live open bidding.
		const raw = c.req.query("tenderId");
		if (
			raw !== undefined &&
			(!Number.isInteger(Number(raw)) || Number(raw) <= 0)
		) {
			return apiError(c, "INVALID_ID");
		}

		const leaderboard = await getVendorLeaderboard(
			db,
			c.get("user").id,
			raw === undefined ? undefined : Number(raw),
		);
		return c.json(leaderboard);
	}),
);
