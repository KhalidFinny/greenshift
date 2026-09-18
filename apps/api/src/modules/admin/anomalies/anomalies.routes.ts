import { Hono } from "hono";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { factory } from "../admin.shared";
import { detectAnomalies } from "./anomalies.service";

export const anomalyRoutes = new Hono<ApiEnv>();

// Read-only rule engine: admin monitors, never mutates operational state.
anomalyRoutes.get(
	"/anomalies",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const { flags, counts } = await detectAnomalies(db);
		return c.json({ flags, counts });
	}),
);
