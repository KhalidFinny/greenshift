import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";
import { ApiFailure } from "./response";

const MAX_JSON_BODY_BYTES = 16 * 1024;

const SAFE_METHODS: Record<string, true> = {
	GET: true,
	HEAD: true,
	OPTIONS: true,
};

// Rejects unsafe requests whose body is not JSON or whose declared size is too
// large. Applied once per role router; safe methods pass straight through.
export const requireJsonBody = createMiddleware<ApiEnv>(
	async (c: Context<ApiEnv>, next: Next) => {
		if (SAFE_METHODS[c.req.method.toUpperCase()]) return next();

		const contentType = (c.req.header("content-type") ?? "")
			.split(";")[0]
			.trim()
			.toLowerCase();
		if (contentType !== "application/json") {
			throw new ApiFailure("UNSUPPORTED_MEDIA_TYPE");
		}

		const contentLength = Number(c.req.header("content-length") ?? "0");
		if (
			Number.isFinite(contentLength) &&
			contentLength > 0 &&
			contentLength > MAX_JSON_BODY_BYTES
		) {
			throw new ApiFailure("PAYLOAD_TOO_LARGE");
		}

		return next();
	},
);
