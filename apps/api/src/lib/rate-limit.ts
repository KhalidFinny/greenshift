import type { Env } from "../env";

const RATE_PREFIX = "greenshift:rl:";

export interface RateLimitResult {
	ok: boolean;
	retryAfter: number;
}

// Fixed-window counter in KV. KV is eventually consistent, so this is a
// coarse throttle that slows brute force and registration abuse, not a hard
// security boundary: appropriate for auth endpoints.
export async function checkRateLimit(
	env: Env,
	key: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const now = Math.floor(Date.now() / 1000);
	const bucket = Math.floor(now / windowSeconds);
	const kvKey = `${RATE_PREFIX}${key}:${bucket}`;
	const current = Number((await env.KV.get(kvKey)) ?? "0");

	if (current >= limit) {
		return { ok: false, retryAfter: (bucket + 1) * windowSeconds - now };
	}

	await env.KV.put(kvKey, String(current + 1), {
		expirationTtl: windowSeconds * 2,
	});
	return { ok: true, retryAfter: 0 };
}

export function clientIp(request: Request): string {
	// Only trust Cloudflare's header; X-Forwarded-For is attacker-controlled
	// wherever CF-Connecting-IP is absent. Untraceable requests share one
	// bounded "unknown" bucket instead of minting unbounded keys.
	const ip = request.headers.get("cf-connecting-ip");
	return ip && /^[\d.a-fA-F:]+$/.test(ip) ? ip : "unknown";
}
