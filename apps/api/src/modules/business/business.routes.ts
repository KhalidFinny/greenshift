import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import {
	requireRole,
	requireSession,
	requireVerifiedCompany,
} from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { brokersRoutes } from "./brokers/brokers.routes";
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
import { verificationRoutes } from "./verification/verification.routes";

export const businessRoutes = new Hono<ApiEnv>();

// `requireJsonBody` is absent here: the document upload is multipart, which that guard rejects.
businessRoutes.use("*", requireSession, requireRole("business"), requireCsrf);

// Route order matters: verification mounts first so an unverified account can reach it.
businessRoutes.route("/", verificationRoutes);
businessRoutes.use("*", requireVerifiedCompany);

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
businessRoutes.route("/", brokersRoutes);
