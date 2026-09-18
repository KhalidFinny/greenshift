import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { StepUpBody, StepUpResponse } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { requireSession } from "../../../lib/authz";
import { requireCsrf } from "../../../lib/csrf";
import { rateLimited, requireJson } from "../../../lib/http";
import { checkRateLimit, clientIp } from "../../../lib/rate-limit";
import { MAX_PASSWORD } from "../auth.shared";
import { stepUpUser } from "./step-up.service";

const factory = createFactory<ApiEnv>();

export const stepUpRoutes = new Hono<ApiEnv>();

stepUpRoutes.post(
	"/step-up",
	requireSession,
	requireCsrf,
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<StepUpBody> | null;
		const password = typeof body?.password === "string" ? body.password : "";
		if (!password || password.length > MAX_PASSWORD) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid password" } },
				400,
			);
		}

		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(c.env, `stepup:ip:${ip}`, 10, 600);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);
		const userCheck = await checkRateLimit(
			c.env,
			`stepup:user:${c.get("user").id}`,
			5,
			600,
		);
		if (!userCheck.ok) return rateLimited(c, userCheck.retryAfter);

		const result = await stepUpUser(c.env, {
			userId: c.get("user").id,
			sessionToken: c.get("sessionToken"),
			password,
		});
		if (result.status === "invalid-session") {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Invalid session" } },
				401,
			);
		}
		if (result.status === "incorrect-password") {
			return c.json(
				{
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Incorrect confirmation password",
					},
				},
				401,
			);
		}

		const response: StepUpResponse = {
			ok: true,
			elevatedUntil: new Date(result.elevatedUntil).toISOString(),
		};
		return c.json(response);
	}),
);
