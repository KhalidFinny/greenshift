import { Hono } from "hono";
import { requestId } from "hono/request-id";

import type { ApiEnv } from "./env";
import { requestLogger } from "./lib/request-logger";
import { ApiFailure, apiError } from "./lib/response";
import { accountRoutes } from "./modules/account/account.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { brokerRoutes } from "./modules/broker/broker.routes";
import { businessRoutes } from "./modules/business/business.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { investorRoutes } from "./modules/investor/investor.routes";
import { vendorRoutes } from "./modules/vendor/vendor.routes";

export const app = new Hono<ApiEnv>();

app.use("*", requestId(), requestLogger);

app.onError((err, c) => {
	if (err instanceof ApiFailure) {
		if (err.retryAfterSeconds !== undefined) {
			c.header("Retry-After", String(err.retryAfterSeconds));
		}
		return apiError(c, err.code, err.message, err.details);
	}
	console.error("[api]", err);
	return apiError(c, "INTERNAL");
});

app.notFound((c) => apiError(c, "NOT_FOUND", "Endpoint not found"));

app.route("/api", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/account", accountRoutes);
app.route("/api/investor", investorRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/vendor", vendorRoutes);
app.route("/api/business", businessRoutes);
app.route("/api/broker", brokerRoutes);

export type AppType = typeof app;

export * from "./contracts";
export * from "./db";
export * from "./env";
