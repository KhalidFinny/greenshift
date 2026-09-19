import type { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";
import { checkRateLimit, clientIp } from "./rate-limit";
import { ApiFailure } from "./response";

const MUTATION_LIMIT = 30;
const MUTATION_WINDOW_SECONDS = 600;

/**
 * Coarse per-module throttle for mutations: one bucket per client IP and one
 * per authenticated user, both scoped to the module and the operation.
 *
 * The defaults suit discrete user actions. A debounced autosave is not one, so
 * a scope that autosaves passes its own numbers rather than raising everyone's.
 */
export function mutationRateLimit(
	module: string,
	scope: string,
	limit = MUTATION_LIMIT,
	windowSeconds = MUTATION_WINDOW_SECONDS,
): MiddlewareHandler<ApiEnv> {
	return createMiddleware<ApiEnv>(async (c: Context<ApiEnv>, next) => {
		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:ip:${ip}`,
			limit,
			windowSeconds,
		);
		if (!ipCheck.ok) {
			throw new ApiFailure("RATE_LIMITED", undefined, ipCheck.retryAfter);
		}
		const userCheck = await checkRateLimit(
			c.env,
			`${module}:${scope}:user:${c.get("user").id}`,
			limit,
			windowSeconds,
		);
		if (!userCheck.ok) {
			throw new ApiFailure("RATE_LIMITED", undefined, userCheck.retryAfter);
		}
		await next();
	});
}
