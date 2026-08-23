import type { AuthUser } from "@greenshift/core";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../db";
import { users } from "../db/schema";
import type { Env } from "../env";
import { verifyPassword } from "../lib/password";
import {
	clearSessionCookie,
	createSession,
	destroySession,
	getSessionUser,
	readCookie,
	SESSION_COOKIE,
	sessionCookie,
} from "../lib/session";

const factory = createFactory<{ Bindings: Env }>();

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post(
	"/login",
	...factory.createHandlers(async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			email?: unknown;
			password?: unknown;
		} | null;
		const email =
			typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const password = typeof body?.password === "string" ? body.password : "";

		if (!email || !password) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Email dan password wajib diisi",
					},
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (
			!user?.hashedPassword ||
			!(await verifyPassword(password, user.hashedPassword))
		) {
			return c.json(
				{
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Email atau password salah",
					},
				},
				401,
			);
		}

		const authUser: AuthUser = {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		};
		const token = await createSession(c.env, authUser);
		c.header("Set-Cookie", sessionCookie(token));
		return c.json({ user: authUser });
	}),
);

authRoutes.get(
	"/me",
	...factory.createHandlers(async (c) => {
		const user = await getSessionUser(
			c.env,
			readCookie(c.req.header("cookie"), SESSION_COOKIE),
		);
		if (!user) {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid" } },
				401,
			);
		}
		return c.json({ user });
	}),
);

authRoutes.post(
	"/logout",
	...factory.createHandlers(async (c) => {
		await destroySession(
			c.env,
			readCookie(c.req.header("cookie"), SESSION_COOKIE),
		);
		c.header("Set-Cookie", clearSessionCookie());
		return c.json({ ok: true });
	}),
);
