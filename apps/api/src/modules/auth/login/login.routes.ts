import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { LoginBody } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { rateLimited, requireJson } from "../../../lib/http";
import { checkRateLimit, clientIp } from "../../../lib/rate-limit";
import { sessionCookie } from "../../../lib/session";
import { MAX_EMAIL, MAX_PASSWORD } from "../auth.shared";
import { loginUser } from "./login.service";

const factory = createFactory<ApiEnv>();

export const loginRoutes = new Hono<ApiEnv>();

loginRoutes.post(
	"/login",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<LoginBody> | null;
		const email =
			typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const password = typeof body?.password === "string" ? body.password : "";

		if (!email || !password) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Email and password are required",
					},
				},
				400,
			);
		}
		if (email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
		}

		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(c.env, `login:ip:${ip}`, 20, 600);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);
		const emailCheck = await checkRateLimit(
			c.env,
			`login:email:${email}`,
			10,
			600,
		);
		if (!emailCheck.ok) return rateLimited(c, emailCheck.retryAfter);

		const result = await loginUser(c.env, email, password);
		if (result.status === "invalid-credentials") {
			return c.json(
				{
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Email or password is incorrect",
					},
				},
				401,
			);
		}

		c.header("Set-Cookie", sessionCookie(result.token));
		return c.json({ user: result.user });
	}),
);
