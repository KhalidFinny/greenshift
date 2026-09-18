import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { listBondListings } from "./market.service";

const factory = createFactory<ApiEnv>();

export const marketRoutes = new Hono<ApiEnv>();

/**
 * No authentication required: this is the landing-adjacent public surface.
 */
marketRoutes.get(
	"/market",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const bonds = await listBondListings(db);
		return c.json({ bonds });
	}),
);
