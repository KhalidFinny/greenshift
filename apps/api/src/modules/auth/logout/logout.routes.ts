import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ApiEnv } from "../../../env";
import { requireSession } from "../../../lib/authz";
import { requireCsrf } from "../../../lib/csrf";
import { apiSuccess } from "../../../lib/response";
import {
	clearSessionCookie,
	destroySession,
	readCookie,
	SESSION_COOKIE,
} from "../../../lib/session";

const factory = createFactory<ApiEnv>();

export const logoutRoutes = new Hono<ApiEnv>();

logoutRoutes.post(
	"/logout",
	requireSession,
	requireCsrf,
	...factory.createHandlers(async (c) => {
		await destroySession(
			c.env,
			readCookie(c.req.header("cookie"), SESSION_COOKIE),
		);
		c.header("Set-Cookie", clearSessionCookie());
		return apiSuccess(c, { ok: true }, "Signed out successfully");
	}),
);
