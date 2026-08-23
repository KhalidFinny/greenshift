import type { AuthUser } from "@greenshift/core";
import type { Env } from "../env";

export const SESSION_COOKIE = "greenshift_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_PREFIX = "greenshift:session:";

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

export async function createSession(env: Env, user: AuthUser): Promise<string> {
	const token = newSessionToken();
	await env.KV.put(SESSION_PREFIX + token, JSON.stringify(user), {
		expirationTtl: SESSION_TTL_SECONDS,
	});
	return token;
}

export async function getSessionUser(
	env: Env,
	token: string | null,
): Promise<AuthUser | null> {
	if (!token) return null;
	const raw = await env.KV.get(SESSION_PREFIX + token);
	if (!raw) return null;
	return JSON.parse(raw) as AuthUser;
}

export async function destroySession(
	env: Env,
	token: string | null,
): Promise<void> {
	if (token) await env.KV.delete(SESSION_PREFIX + token);
}

export function sessionCookie(token: string): string {
	return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
