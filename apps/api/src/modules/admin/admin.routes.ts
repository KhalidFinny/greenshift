import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { requireJsonBody } from "../../lib/http";
import { analyticsRoutes } from "./analytics/analytics.routes";
import { anomalyRoutes } from "./anomalies/anomalies.routes";
import { auditLogRoutes } from "./audit-logs/audit-logs.routes";
import { blueprintRoutes } from "./blueprints/blueprints.routes";
import { brokerRoutes } from "./brokers/brokers.routes";
import { investmentRoutes } from "./investments/investments.routes";
import { projectRoutes } from "./projects/projects.routes";
import { roiPaymentRoutes } from "./roi-payments/roi-payments.routes";
import { statsRoutes } from "./stats/stats.routes";
import { userRoutes } from "./users/users.routes";
import { vendorRoutes } from "./vendors/vendors.routes";

export const adminRoutes = new Hono<ApiEnv>();

// Every admin endpoint requires an admin session. CSRF is enforced only for
// unsafe methods inside the middleware.
adminRoutes.use(
	"*",
	requireSession,
	requireRole("admin"),
	requireCsrf,
	requireJsonBody,
);

adminRoutes.route("/", userRoutes);
adminRoutes.route("/", projectRoutes);
adminRoutes.route("/", blueprintRoutes);
adminRoutes.route("/", investmentRoutes);
adminRoutes.route("/", roiPaymentRoutes);
adminRoutes.route("/", auditLogRoutes);
adminRoutes.route("/", statsRoutes);
adminRoutes.route("/", analyticsRoutes);
adminRoutes.route("/", vendorRoutes);
adminRoutes.route("/", brokerRoutes);
adminRoutes.route("/", anomalyRoutes);
