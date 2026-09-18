import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { loginRoutes } from "./login/login.routes";
import { logoutRoutes } from "./logout/logout.routes";
import { registerRoutes } from "./register/register.routes";
import { sessionRoutes } from "./session/session.routes";
import { stepUpRoutes } from "./step-up/step-up.routes";

export const authRoutes = new Hono<ApiEnv>();

// Session, CSRF and rate-limit middleware are applied per route inside each
// feature router, preserving the original per-endpoint guard order.
authRoutes.route("/", loginRoutes);
authRoutes.route("/", registerRoutes);
authRoutes.route("/", sessionRoutes);
authRoutes.route("/", stepUpRoutes);
authRoutes.route("/", logoutRoutes);
