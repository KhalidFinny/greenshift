import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { deliveryRoutes } from "./delivery";
import { leaderboardRoutes } from "./leaderboard";
import { negotiationRoutes } from "./negotiations";
import { notificationRoutes } from "./notifications";
import { participationRoutes } from "./participation";
import { portfolioRoutes } from "./portfolio";
import { profileRoutes } from "./profile";
import { projectsRoutes } from "./projects";
import { proposalUpdateRoutes } from "./proposal-update";
import { proposalsRoutes } from "./proposals";

export const vendorRoutes = new Hono<ApiEnv>();

// Every vendor endpoint requires a vendor session. CSRF is enforced only for
// unsafe methods inside the middleware.
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
