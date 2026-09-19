import { Hono } from "hono";
import type { ApiEnv } from "../../env";
import { requireSession } from "../../lib/authz";
import { requireCsrf } from "../../lib/csrf";
import { avatarRoutes } from "./avatar/avatar.routes";

export const accountRoutes = new Hono<ApiEnv>();

// Account endpoints are shared by every role, so they take a session but no
// role. requireJsonBody is deliberately absent here: the picture upload is
// multipart, and that guard would reject it.
accountRoutes.use("*", requireSession, requireCsrf);

accountRoutes.route("/", avatarRoutes);
