import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { RegisterBody } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { clientIp, enforceRateLimit } from "../../../lib/rate-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import { sessionCookie } from "../../../lib/session";
import { MAX_EMAIL, MAX_PASSWORD } from "../auth.shared";
import { registerUser } from "./register.service";

const factory = createFactory<ApiEnv>();

export const registerRoutes = new Hono<ApiEnv>();

// Limits for the account fields below; MAX_COMPANY mirrors the users table.
const MAX_NAME = 120;
const MAX_COMPANY = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

registerRoutes.post(
	"/register",
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<RegisterBody> | null;

		const name = typeof body?.name === "string" ? body.name.trim() : "";
		const email =
			typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const password = typeof body?.password === "string" ? body.password : "";
		const companyName =
			typeof body?.companyName === "string" ? body.companyName.trim() : "";

		if (!name || !email || !password || !companyName) {
			return apiError(
				c,
				"VALIDATION",
				"Name, email, password, and company name are required",
			);
		}
		if (!EMAIL_RE.test(email)) {
			return apiError(c, "VALIDATION", "Invalid email");
		}
		if (password.length < 8) {
			return apiError(
				c,
				"VALIDATION",
				"Password must be at least 8 characters",
			);
		}
		if (
			name.length > MAX_NAME ||
			email.length > MAX_EMAIL ||
			password.length > MAX_PASSWORD ||
			companyName.length > MAX_COMPANY
		) {
			return apiError(c, "VALIDATION");
		}

		await enforceRateLimit(c.env, `register:ip:${clientIp(c.req.raw)}`, 5, 900);

		const result = await registerUser(c.env, {
			name,
			email,
			password,
			companyName,
		});
		if (result.status === "email-taken") {
			return apiError(c, "EMAIL_TAKEN");
		}

		c.header("Set-Cookie", sessionCookie(result.token));
		return apiSuccess(
			c,
			{ user: result.user },
			"Account created successfully",
			201,
		);
	}),
);
