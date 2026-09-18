import { Hono } from "hono";

import type { ApiEnv } from "./env";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { brokerRoutes } from "./modules/broker/broker.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { investorRoutes } from "./modules/investor/investor.routes";
import { vendorRoutes } from "./modules/vendor/vendor.routes";

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
app.route("/api/broker", brokerRoutes);

export type AppType = typeof app;

export * from "./contracts";
export * from "./db";
export * from "./env";
