import type { AuthUser } from "@greenshift/core";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { createDb } from "../db";
import { users } from "../db/schema";
import type { ApiEnv } from "../env";
import {
	getSessionUser,
	isStepUpFresh,
	readCookie,
	SESSION_COOKIE,
} from "./session";

export function authUserFrom(user: typeof users.$inferSelect): AuthUser {
	return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export const requireSession = createMiddleware<ApiEnv>(
	async (c: Context<ApiEnv>, next: Next) => {
		const token = readCookie(c.req.header("cookie"), SESSION_COOKIE);
		const session = await getSessionUser(c.env, token);
		if (!session || !token) {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Invalid session" } },
				401,
			);
		}

		const db = createDb(c.env.DB);
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId))
			.limit(1);
		if (!user) {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Invalid session" } },
				401,
			);
		}

		c.set("user", authUserFrom(user));
		c.set("session", session);
		c.set("sessionToken", token);
		await next();
	},
);

export function requireRole(...roles: AuthUser["role"][]) {
	return createMiddleware<ApiEnv>(async (c: Context<ApiEnv>, next: Next) => {
		const user = c.get("user");
		if (!user || !roles.includes(user.role)) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "You do not have access to this resource",
					},
				},
				403,
			);
		}
		await next();
	});
}

export const requireRecentStepUp = createMiddleware<ApiEnv>(
	async (c: Context<ApiEnv>, next: Next) => {
		const session = c.get("session");
		if (!session || !isStepUpFresh(session)) {
			return c.json(
				{
					error: {
						code: "STEP_UP_REQUIRED",
						message:
							"Password confirmation is required for this sensitive action",
					},
				},
				428,
			);
		}
		await next();
	},
);
