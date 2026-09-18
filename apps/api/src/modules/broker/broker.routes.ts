import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { requireVerifiedBroker } from "./broker.shared";
import { documentRoutes } from "./documents/documents.routes";
import { notificationRoutes } from "./notifications/notifications.routes";
import { profileRoutes } from "./profile/profile.routes";
import { projectRoutes } from "./projects/projects.routes";
import { reportRoutes } from "./reports/reports.routes";

export const brokerRoutes = new Hono<ApiEnv>();

// Every broker endpoint requires a broker session. CSRF is enforced only for
// unsafe methods inside the middleware.
brokerRoutes.use("*", requireSession, requireRole("broker"), requireCsrf);

// Settings and notifications stay reachable while verification is pending.
brokerRoutes.route("/", profileRoutes);
brokerRoutes.route("/", notificationRoutes);

// Assigned projects, document requests and reports require a verified broker
// (rule 1: a broker cannot receive or process projects before verification).
const verifiedOnly = new Hono<ApiEnv>();
verifiedOnly.use("*", requireVerifiedBroker);
verifiedOnly.route("/", projectRoutes);
verifiedOnly.route("/", documentRoutes);
verifiedOnly.route("/", reportRoutes);
brokerRoutes.route("/", verifiedOnly);
