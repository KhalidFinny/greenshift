import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { CsrfResponse } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { requireSession } from "../../../lib/authz";

const factory = createFactory<ApiEnv>();

export const sessionRoutes = new Hono<ApiEnv>();

sessionRoutes.get(
	"/me",
	requireSession,
	...factory.createHandlers(async (c) => {
		return c.json({ user: c.get("user") });
	}),
);

sessionRoutes.get(
	"/csrf",
	requireSession,
	...factory.createHandlers(async (c) => {
		const session = c.get("session");
		const response: CsrfResponse = {
			csrfToken: session.csrfToken,
			stepUpUntil:
				typeof session.stepUpUntil === "number"
					? new Date(session.stepUpUntil).toISOString()
					: null,
		};
		return c.json(response);
	}),
);
