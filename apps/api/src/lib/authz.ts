import type { AuthUser } from "@greenshift/core";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { createDb } from "../db";
import { users } from "../db/schema";
import type { ApiEnv } from "../env";
import { getSessionUser, readCookie, SESSION_COOKIE } from "./session";

export function authUserFrom(user: typeof users.$inferSelect): AuthUser {
	return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// Resolves the session to a live user row (fresh role every request) so a
// demoted or deleted account loses access immediately.
export const requireSession = createMiddleware<ApiEnv>(
	async (c: Context<ApiEnv>, next: Next) => {
		const session = await getSessionUser(
			c.env,
			readCookie(c.req.header("cookie"), SESSION_COOKIE),
		);
		if (!session) {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid" } },
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
			// Account deleted — the session is dead.
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid" } },
				401,
			);
		}

		c.set("user", authUserFrom(user));
		await next();
	},
);

// Requires an authenticated session whose role matches one of `roles`.
export function requireRole(...roles: AuthUser["role"][]) {
	return createMiddleware<ApiEnv>(async (c: Context<ApiEnv>, next: Next) => {
		const user = c.get("user");
		if (!user || !roles.includes(user.role)) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Anda tidak memiliki akses ke sumber daya ini",
					},
				},
				403,
			);
		}
		await next();
	});
}
