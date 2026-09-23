import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { documentsRoutes } from "./documents/documents.routes";
import { draftsRoutes } from "./drafts/drafts.routes";
import { forecastRoutes } from "./forecast/forecast.routes";
import { matchmakingRoutes } from "./matchmaking/matchmaking.routes";
import { notificationRoutes } from "./notifications/notifications.routes";
import { procurementRoutes } from "./procurement/procurement.routes";
import { profileRoutes } from "./profile/profile.routes";
import { projectsRoutes } from "./projects/projects.routes";
import { readingRoutes } from "./review/reading.routes";
import { riskRoutes } from "./risk/risk.routes";

export const businessRoutes = new Hono<ApiEnv>();

/**
 * Every business endpoint requires a business session, and CSRF is enforced for
 * unsafe methods only.
 *
 * `requireJsonBody` is deliberately absent here, unlike the other role routers:
 * the document upload is multipart, and that guard rejects any unsafe request
 * that is not JSON. The JSON mutations apply it individually instead, so each
 * route states its own body contract.
 */
businessRoutes.use("*", requireSession, requireRole("business"), requireCsrf);

businessRoutes.route("/", draftsRoutes);
businessRoutes.route("/", documentsRoutes);
businessRoutes.route("/", projectsRoutes);
businessRoutes.route("/", profileRoutes);
businessRoutes.route("/", riskRoutes);
businessRoutes.route("/", readingRoutes);
businessRoutes.route("/", forecastRoutes);
businessRoutes.route("/", notificationRoutes);
businessRoutes.route("/", matchmakingRoutes);
businessRoutes.route("/", procurementRoutes);
