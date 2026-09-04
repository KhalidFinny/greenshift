import type { Env } from "../env";

export const SESSION_COOKIE = "__Host-greenshift_session";
// Absolute cap (cookie Max-Age + KV TTL). OWASP guidance: even low-risk
// apps should cap at 4–8h; finance-facing data at 1–2h. 8h balances demo
// usability with the "no infinite sessions" control.
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SESSION_MAX_MS = SESSION_TTL_SECONDS * 1000;
const SESSION_PREFIX = "greenshift:session:";
export const STEP_UP_TTL_MS = 10 * 60 * 1000;
// Idle window: a session is dropped when no authenticated request has been
// seen for this long (checked on every session read, SSR included).
// OWASP idle range for low-risk apps is 15–30 min — 15 min is the default
// (demo/testing can shorten via SESSION_IDLE_MINUTES).
export const SESSION_IDLE_MS_DEFAULT = 15 * 60 * 1000;
// Refresh the stored lastActiveAt at most this often to keep the session
// sliding without paying a KV write on every request.
const SESSION_REFRESH_MS = 60 * 1000;

export interface SessionPayload {
	userId: number;
	csrfToken: string;
	stepUpUntil: number | null;
	/** Epoch ms of the most recent authenticated request. */
	lastActiveAt: number;
	/** Epoch ms when the session was created — enforces the absolute cap. */
	issuedAt: number;
}

function idleMs(env: Env): number {
	const raw = env.SESSION_IDLE_MINUTES?.trim();
	const minutes = raw ? Number(raw) : NaN;
	return Number.isFinite(minutes) && minutes > 0
		? Math.round(minutes * 60 * 1000)
		: SESSION_IDLE_MS_DEFAULT;
}

export function readCookie(
	cookieHeader: string | null | undefined,
	name: string,
): string | null {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return rest.join("=") || null;
	}
	return null;
}

function newHexToken(bytes = 32): string {
	const raw = crypto.getRandomValues(new Uint8Array(bytes));
	return Array.from(raw, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeSession(
	parsed: Partial<SessionPayload>,
): SessionPayload | null {
	const userId = parsed.userId;
	if (
		typeof userId !== "number" ||
		!Number.isInteger(userId) ||
		userId <= 0
	) {
		return null;
	}

	const csrfToken =
		typeof parsed.csrfToken === "string" && parsed.csrfToken.length >= 16
			? parsed.csrfToken
			: newHexToken(16);
	const stepUpUntil =
		typeof parsed.stepUpUntil === "number" &&
		Number.isFinite(parsed.stepUpUntil) &&
		parsed.stepUpUntil > Date.now()
			? parsed.stepUpUntil
			: null;
	// Sessions written before idle tracking get a fresh timestamp — they are
	// rewritten once (needsUpgrade below) and expire normally from then on.
	const lastActiveAt =
		typeof parsed.lastActiveAt === "number" &&
		Number.isFinite(parsed.lastActiveAt) &&
		parsed.lastActiveAt > 0
			? parsed.lastActiveAt
			: Date.now();
	// Sessions written before absolute-cap tracking get a fresh timestamp —
	// they are rewritten once (needsUpgrade below) and expire normally.
	const issuedAt =
		typeof parsed.issuedAt === "number" &&
		Number.isFinite(parsed.issuedAt) &&
		parsed.issuedAt > 0
			? parsed.issuedAt
			: Date.now();

	return { userId, csrfToken, stepUpUntil, lastActiveAt, issuedAt };
}

async function writeSession(
	env: Env,
	token: string,
	payload: SessionPayload,
): Promise<void> {
	await env.KV.put(SESSION_PREFIX + token, JSON.stringify(payload), {
		expirationTtl: SESSION_TTL_SECONDS,
	});
}

export async function createSession(env: Env, userId: number): Promise<string> {
	const token = newHexToken();
	await writeSession(env, token, {
		userId,
		csrfToken: newHexToken(16),
		stepUpUntil: null,
		lastActiveAt: Date.now(),
		issuedAt: Date.now(),
	});
	return token;
}

export async function getSessionUser(
	env: Env,
	token: string | null,
): Promise<SessionPayload | null> {
	if (!token) return null;
	const key = SESSION_PREFIX + token;
	const raw = await env.KV.get(key);
	if (!raw) return null;
	try {
		const parsed = normalizeSession(JSON.parse(raw) as Partial<SessionPayload>);
		if (!parsed) {
			await env.KV.delete(key);
			return null;
		}
		const now = Date.now();
		const maxIdle = idleMs(env);
		if (now - parsed.lastActiveAt > maxIdle) {
			// Inactive past the threshold — drop the session so the next SSR
			// load or API call lands back on the login page.
			await env.KV.delete(key);
			return null;
		}
		if (now - parsed.issuedAt > SESSION_MAX_MS) {
			// Absolute cap reached regardless of activity — periodic
			// re-authentication (OWASP absolute timeout).
			await env.KV.delete(key);
			return null;
		}
		const refreshed = { ...parsed, lastActiveAt: now };
		const needsRefresh = now - parsed.lastActiveAt >= SESSION_REFRESH_MS;
		const needsUpgrade = raw !== JSON.stringify(parsed);
		if (needsUpgrade || needsRefresh) {
			await writeSession(env, token, refreshed);
		}
		return refreshed;
	} catch {
		await env.KV.delete(key);
		return null;
	}
}

export async function elevateSession(
	env: Env,
	token: string,
	elevatedUntil = Date.now() + STEP_UP_TTL_MS,
): Promise<SessionPayload | null> {
	const session = await getSessionUser(env, token);
	if (!session) return null;
	const next = { ...session, stepUpUntil: elevatedUntil, lastActiveAt: Date.now() };
	await writeSession(env, token, next);
	return next;
}

export function isStepUpFresh(
	session: SessionPayload,
	now = Date.now(),
): boolean {
	return typeof session.stepUpUntil === "number" && session.stepUpUntil > now;
}

export async function destroySession(
	env: Env,
	token: string | null,
): Promise<void> {
	if (token) await env.KV.delete(SESSION_PREFIX + token);
}

export function sessionCookie(token: string): string {
	return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE}=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0`;
}
