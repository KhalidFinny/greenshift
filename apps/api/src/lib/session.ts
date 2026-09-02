import type { Env } from "../env";

export const SESSION_COOKIE = "__Host-greenshift_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_PREFIX = "greenshift:session:";
export const STEP_UP_TTL_MS = 10 * 60 * 1000;

export interface SessionPayload {
	userId: number;
	csrfToken: string;
	stepUpUntil: number | null;
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

	return { userId, csrfToken, stepUpUntil };
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
		const needsUpgrade = raw !== JSON.stringify(parsed);
		if (needsUpgrade) {
			await writeSession(env, token, parsed);
		}
		return parsed;
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
	const next = { ...session, stepUpUntil: elevatedUntil };
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
