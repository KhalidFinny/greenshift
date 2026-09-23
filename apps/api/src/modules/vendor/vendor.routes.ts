import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { deliveryRoutes } from "./delivery/delivery.routes";
import { leaderboardRoutes } from "./leaderboard/leaderboard.routes";
import { negotiationRoutes } from "./negotiations/negotiations.routes";
import { notificationRoutes } from "./notifications/notifications.routes";
import { participationRoutes } from "./participation/participation.routes";
import { portfolioRoutes } from "./portfolio/portfolio.routes";
import { profileRoutes } from "./profile/profile.routes";
import { projectsRoutes } from "./projects/projects.routes";
import { proposalUpdateRoutes } from "./proposal-update/proposal-update.routes";
import { proposalsRoutes } from "./proposals/proposals.routes";

export const vendorRoutes = new Hono<ApiEnv>();

/**
 * Every vendor endpoint requires a vendor session. CSRF is enforced only for
 * unsafe methods inside the middleware.
 *
 * `requireJsonBody` is deliberately absent here, unlike the admin and broker
 * routers: the portfolio document upload is multipart, and that guard rejects
 * any unsafe request that is not JSON. The JSON mutations apply it
 * individually instead, so each route states its own body contract.
 */
vendorRoutes.use("*", requireSession, requireRole("vendor"), requireCsrf);

vendorRoutes.route("/", projectsRoutes);
vendorRoutes.route("/", participationRoutes);
vendorRoutes.route("/", profileRoutes);
vendorRoutes.route("/", proposalsRoutes);
vendorRoutes.route("/", proposalUpdateRoutes);
vendorRoutes.route("/", negotiationRoutes);
vendorRoutes.route("/", notificationRoutes);
vendorRoutes.route("/", leaderboardRoutes);
vendorRoutes.route("/", portfolioRoutes);
vendorRoutes.route("/", deliveryRoutes);
