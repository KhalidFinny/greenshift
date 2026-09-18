import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { marketRoutes } from "./market/market.routes";

export const investorRoutes = new Hono<ApiEnv>();

investorRoutes.route("/", marketRoutes);
