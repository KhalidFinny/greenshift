import type { Context } from "hono";
import type { ApiEnv } from "../env";
import { rateLimited } from "./http";
import { checkRateLimit, clientIp } from "./rate-limit";

/**
 * Coarse per-module throttle for mutations: one bucket per client IP and one
 * per authenticated user, both scoped to the module and the operation.
 */
export function mutationRateLimit(
	module: string,
	scope: string,
): (c: Context<ApiEnv>) => Promise<Response | null> {
	return async (c) => {
		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:ip:${ip}`,
			30,
			600,
		);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);
		const userCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:user:${c.get("user").id}`,
			30,
			600,
		);
		if (!userCheck.ok) return rateLimited(c, userCheck.retryAfter);
		return null;
	};
}
