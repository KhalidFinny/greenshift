import type { Context } from "hono";
import type { ApiEnv } from "../env";

const MAX_JSON_BODY_BYTES = 16 * 1024;

// Rejects requests whose body is not JSON, or whose declared body size is
// obviously too large for our auth/admin/investor mutation endpoints.
export function requireJson(c: Context<ApiEnv>): Response | null {
	const contentType = (c.req.header("content-type") ?? "")
		.split(";")[0]
		.trim()
		.toLowerCase();
	if (contentType !== "application/json") {
		return c.json(
			{
				error: {
					code: "UNSUPPORTED_MEDIA_TYPE",
					message: "Content-Type must be application/json",
				},
			},
			415,
		);
	}

	const contentLength = Number(c.req.header("content-length") ?? "0");
	if (
		Number.isFinite(contentLength) &&
		contentLength > 0 &&
		contentLength > MAX_JSON_BODY_BYTES
	) {
		return c.json(
			{
				error: {
					code: "PAYLOAD_TOO_LARGE",
					message: "Payload too large",
				},
			},
			413,
		);
	}
	return null;
}

export function rateLimited(c: Context<ApiEnv>, retryAfter: number): Response {
	c.header("Retry-After", String(retryAfter));
	return c.json(
		{
			error: {
				code: "RATE_LIMITED",
				message: "Too many attempts, please try again later",
			},
		},
		429,
	);
}
