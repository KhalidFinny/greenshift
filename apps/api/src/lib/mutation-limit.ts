import type { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";
import { checkRateLimit, clientIp } from "./rate-limit";
import { ApiFailure } from "./response";

/**
 * Coarse per-module throttle for mutations: one bucket per client IP and one
 * per authenticated user, both scoped to the module and the operation.
 */
export function mutationRateLimit(
	module: string,
	scope: string,
): MiddlewareHandler<ApiEnv> {
	return createMiddleware<ApiEnv>(async (c: Context<ApiEnv>, next) => {
		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:ip:${ip}`,
			30,
			600,
		);
		if (!ipCheck.ok) {
			throw new ApiFailure("RATE_LIMITED", undefined, ipCheck.retryAfter);
		}
		const userCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:user:${c.get("user").id}`,
			30,
			600,
		);
		if (!userCheck.ok) {
			throw new ApiFailure("RATE_LIMITED", undefined, userCheck.retryAfter);
		}
		await next();
	});
}
