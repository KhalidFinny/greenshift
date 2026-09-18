import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { getVendorLeaderboard } from "./leaderboard.service";

const factory = createFactory<ApiEnv>();

export const leaderboardRoutes = new Hono<ApiEnv>();

leaderboardRoutes.get(
	"/leaderboard",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const leaderboard = await getVendorLeaderboard(db, c.get("user").id);
		return c.json(leaderboard);
	}),
);
