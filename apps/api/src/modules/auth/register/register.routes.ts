import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { RegisterBody } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { rateLimited, requireJson } from "../../../lib/http";
import { checkRateLimit, clientIp } from "../../../lib/rate-limit";
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
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

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
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Name, email, password, and company name are required",
					},
				},
				400,
			);
		}
		if (!EMAIL_RE.test(email)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid email" } },
				400,
			);
		}
		if (password.length < 8) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Password must be at least 8 characters",
					},
				},
				400,
			);
		}
		if (
			name.length > MAX_NAME ||
			email.length > MAX_EMAIL ||
			password.length > MAX_PASSWORD ||
			companyName.length > MAX_COMPANY
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
		}

		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(c.env, `register:ip:${ip}`, 5, 900);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);

		const result = await registerUser(c.env, {
			name,
			email,
			password,
			companyName,
		});
		if (result.status === "email-taken") {
			return c.json(
				{
					error: {
						code: "EMAIL_TAKEN",
						message: "Email already registered",
					},
				},
				409,
			);
		}

		c.header("Set-Cookie", sessionCookie(result.token));
		return c.json({ user: result.user }, 201);
	}),
);
