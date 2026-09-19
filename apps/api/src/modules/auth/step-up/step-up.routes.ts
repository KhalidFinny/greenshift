import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { StepUpBody, StepUpResponse } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { requireSession } from "../../../lib/authz";
import { requireCsrf } from "../../../lib/csrf";
import { clientIp, enforceRateLimit } from "../../../lib/rate-limit";
import { apiError } from "../../../lib/response";
import { MAX_PASSWORD } from "../auth.shared";
import { stepUpUser } from "./step-up.service";

const factory = createFactory<ApiEnv>();

export const stepUpRoutes = new Hono<ApiEnv>();

stepUpRoutes.post(
	"/step-up",
	requireSession,
	requireCsrf,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<StepUpBody> | null;
		const password = typeof body?.password === "string" ? body.password : "";
		if (!password || password.length > MAX_PASSWORD) {
			return apiError(c, "VALIDATION", "Invalid password");
		}

		await enforceRateLimit(c.env, `stepup:ip:${clientIp(c.req.raw)}`, 10, 600);
		await enforceRateLimit(c.env, `stepup:user:${c.get("user").id}`, 5, 600);

		const result = await stepUpUser(c.env, {
			userId: c.get("user").id,
			sessionToken: c.get("sessionToken"),
			password,
		});
		if (result.status === "invalid-session") {
			return apiError(c, "UNAUTHORIZED");
		}
		if (result.status === "incorrect-password") {
			return apiError(
				c,
				"INVALID_CREDENTIALS",
				"Incorrect confirmation password",
			);
		}

		const response: StepUpResponse = {
			ok: true,
			elevatedUntil: new Date(result.elevatedUntil).toISOString(),
		};
		return c.json(response);
	}),
);
