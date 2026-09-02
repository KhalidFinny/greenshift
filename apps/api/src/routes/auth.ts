import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	CsrfResponse,
	LoginBody,
	RegisterBody,
	StepUpBody,
	StepUpResponse,
} from "../contracts";
import { createDb } from "../db";
import { auditLogs, users } from "../db/schema";
import type { ApiEnv } from "../env";
import { authUserFrom, requireSession } from "../lib/authz";
import { requireCsrf } from "../lib/csrf";
import { rateLimited, requireJson } from "../lib/http";
import {
	hashPassword,
	passwordNeedsRehash,
	verifyPassword,
} from "../lib/password";
import { checkRateLimit, clientIp } from "../lib/rate-limit";
import {
	clearSessionCookie,
	createSession,
	destroySession,
	elevateSession,
	readCookie,
	SESSION_COOKIE,
	sessionCookie,
	STEP_UP_TTL_MS,
} from "../lib/session";

const factory = createFactory<ApiEnv>();

export const authRoutes = new Hono<ApiEnv>();

const MAX_EMAIL = 254;
const MAX_PASSWORD = 128;
const MAX_NAME = 120;
const MAX_COMPANY = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let dummyHashPromise: Promise<string> | null = null;



authRoutes.post(
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
						message: "Email dan password wajib diisi",
					},
				},
				400,
			);
		}
		if (email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
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

		const db = createDb(c.env.DB);
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user?.hashedPassword) {
			dummyHashPromise ??= hashPassword("dummy-password");
			await verifyPassword(password, await dummyHashPromise);
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
		if (!(await verifyPassword(password, user.hashedPassword))) {
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

		if (passwordNeedsRehash(user.hashedPassword)) {
			await db
				.update(users)
				.set({ hashedPassword: await hashPassword(password) })
				.where(eq(users.id, user.id));
		}

		const authUser = authUserFrom(user);
		const token = await createSession(c.env, authUser.id);
		c.header("Set-Cookie", sessionCookie(token));
		return c.json({ user: authUser });
	}),
);

authRoutes.post(
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
						message: "Nama, email, kata sandi, dan nama perusahaan wajib diisi",
					},
				},
				400,
			);
		}
		if (!EMAIL_RE.test(email)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Email tidak valid" } },
				400,
			);
		}
		if (password.length < 8) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Kata sandi minimal 8 karakter",
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
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(c.env, `register:ip:${ip}`, 5, 900);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);

		const db = createDb(c.env.DB);
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		if (existing) {
			return c.json(
				{
					error: {
						code: "EMAIL_TAKEN",
						message: "Email sudah terdaftar",
					},
				},
				409,
			);
		}

		const hashedPassword = await hashPassword(password);
		let user: typeof users.$inferSelect;
		try {
			[user] = await db
				.insert(users)
				.values({
					email,
					name,
					companyName,
					hashedPassword,
					role: "business",
				})
				.returning();
		} catch (err) {
			if (String(err).includes("UNIQUE constraint")) {
				return c.json(
					{
						error: {
							code: "EMAIL_TAKEN",
							message: "Email sudah terdaftar",
						},
					},
					409,
				);
			}
			throw err;
		}

		const authUser = authUserFrom(user);
		const token = await createSession(c.env, authUser.id);
		c.header("Set-Cookie", sessionCookie(token));
		return c.json({ user: authUser }, 201);
	}),
);

authRoutes.get(
	"/me",
	requireSession,
	...factory.createHandlers(async (c) => {
		return c.json({ user: c.get("user") });
	}),
);

authRoutes.get(
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

authRoutes.post(
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
				{ error: { code: "VALIDATION", message: "Password tidak valid" } },
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

		const db = createDb(c.env.DB);
		const [user] = await db
			.select({ id: users.id, hashedPassword: users.hashedPassword })
			.from(users)
			.where(eq(users.id, c.get("user").id))
			.limit(1);
		if (!user?.hashedPassword) {
			return c.json(
				{ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid" } },
				401,
			);
		}
		if (!(await verifyPassword(password, user.hashedPassword))) {
			return c.json(
				{
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Password konfirmasi salah",
					},
				},
				401,
			);
		}

		const elevatedUntil = Date.now() + STEP_UP_TTL_MS;
		await elevateSession(c.env, c.get("sessionToken"), elevatedUntil);
		await db.insert(auditLogs).values({
			userId: c.get("user").id,
			action: "auth.step_up",
			entityType: "session",
			entityId: c.get("user").id,
			metadata: { elevatedUntil: new Date(elevatedUntil).toISOString() },
		});

		const response: StepUpResponse = {
			ok: true,
			elevatedUntil: new Date(elevatedUntil).toISOString(),
		};
		return c.json(response);
	}),
);

authRoutes.post(
	"/logout",
	requireSession,
	requireCsrf,
	...factory.createHandlers(async (c) => {
		await destroySession(c.env, readCookie(c.req.header("cookie"), SESSION_COOKIE));
		c.header("Set-Cookie", clearSessionCookie());
		return c.json({ ok: true });
	}),
);
