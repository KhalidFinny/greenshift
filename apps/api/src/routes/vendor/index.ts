import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireRole, requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { participationRoutes } from "./participation";
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
