import { Hono } from "hono";

import type { ApiEnv } from "./env";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { investorRoutes } from "./routes/investor";
import { vendorRoutes } from "./routes/vendor";

export const app = new Hono<ApiEnv>();

app.onError((err, c) => {
	console.error("[api]", err);
	return c.json(
		{ error: { code: "INTERNAL", message: "An internal error occurred" } },
		500,
	);
});

app.notFound((c) =>
	c.json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } }, 404),
);

app.route("/api", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/investor", investorRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/vendor", vendorRoutes);

export type AppType = typeof app;

export * from "./contracts";
export * from "./db";
export * from "./env";
