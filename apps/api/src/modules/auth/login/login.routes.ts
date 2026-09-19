import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { LoginBody } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { clientIp, enforceRateLimit } from "../../../lib/rate-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import { sessionCookie } from "../../../lib/session";
import { MAX_EMAIL, MAX_PASSWORD } from "../auth.shared";
import { loginUser } from "./login.service";

const factory = createFactory<ApiEnv>();

export const loginRoutes = new Hono<ApiEnv>();

loginRoutes.post(
	"/login",
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<LoginBody> | null;
		const email =
			typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const password = typeof body?.password === "string" ? body.password : "";

		if (!email || !password) {
			return apiError(c, "VALIDATION", "Email and password are required");
		}
		if (email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
			return apiError(c, "VALIDATION");
		}

		await enforceRateLimit(c.env, `login:ip:${clientIp(c.req.raw)}`, 20, 600);
		await enforceRateLimit(c.env, `login:email:${email}`, 10, 600);

		const result = await loginUser(c.env, email, password);
		if (result.status === "invalid-credentials") {
			return apiError(c, "INVALID_CREDENTIALS");
		}

		c.header("Set-Cookie", sessionCookie(result.token));
		return apiSuccess(c, { user: result.user }, "Signed in successfully");
	}),
);
