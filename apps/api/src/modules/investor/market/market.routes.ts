import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { listBondListings } from "./market.service";

const factory = createFactory<ApiEnv>();

export const marketRoutes = new Hono<ApiEnv>();

/** Public surface: no authentication required. */
marketRoutes.get(
	"/market",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const bonds = await listBondListings(db);
		return c.json({ bonds });
	}),
);
