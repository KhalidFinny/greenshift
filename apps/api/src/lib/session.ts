import type { Env } from "../env";

export const SESSION_COOKIE = "__Host-greenshift_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_PREFIX = "greenshift:session:";

// Sessions store only the user id; the full user (and role) is re-resolved
// from D1 on every request so privilege changes take effect immediately.
export interface SessionPayload {
	userId: number;
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

function newSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(env: Env, userId: number): Promise<string> {
	const token = newSessionToken();
	await env.KV.put(
		SESSION_PREFIX + token,
		JSON.stringify({ userId } satisfies SessionPayload),
		{ expirationTtl: SESSION_TTL_SECONDS },
	);
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
		const parsed = JSON.parse(raw) as Partial<SessionPayload>;
		const userId = parsed.userId;
		if (
			typeof userId !== "number" ||
			!Number.isInteger(userId) ||
			userId <= 0
		) {
			await env.KV.delete(key);
			return null;
		}
		return { userId };
	} catch {
		// Corrupt session value — treat as unauthenticated and drop it.
		await env.KV.delete(key);
		return null;
	}
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
