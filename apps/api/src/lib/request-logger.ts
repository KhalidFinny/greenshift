import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";
import { ApiFailure, apiErrorCodes } from "./response";

// One JSON access-log line per API request. The status comes from the response or
// the raised failure, so a request that fails before a response is still logged.
export const requestLogger = createMiddleware<ApiEnv>(async (c, next) => {
	const startedAt = performance.now();
	let status = c.res.status;

	try {
		await next();
		status = c.res.status;
	} catch (error) {
		status =
			error instanceof ApiFailure ? apiErrorCodes[error.code].status : 500;
		throw error;
	} finally {
		console.log(
			JSON.stringify({
				requestId: c.get("requestId"),
				method: c.req.method,
				path: c.req.path,
				status,
				durationMs: Math.round(performance.now() - startedAt),
			}),
		);
	}
});
