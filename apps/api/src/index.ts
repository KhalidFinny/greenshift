import { Hono } from "hono";

import type { Env } from "./env";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";

export const app = new Hono<{ Bindings: Env }>();

app.route("/api", healthRoutes);
app.route("/api/auth", authRoutes);

export type AppType = typeof app;

export * from "./db";
export * from "./env";
