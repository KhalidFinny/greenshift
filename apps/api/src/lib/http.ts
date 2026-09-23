import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";
import { ApiFailure } from "./response";

const MAX_JSON_BODY_BYTES = 16 * 1024;

/** Multipart boundaries and part headers, on top of the file's own bytes. */
export const MULTIPART_ENVELOPE_SLACK = 8 * 1024;

/** True when the declared body exceeds `maxBytes`, checked before it is buffered. */
export function declaredBodyTooLarge(
	c: Context<ApiEnv>,
	maxBytes: number,
): boolean {
	const declared = Number(c.req.header("content-length") ?? "0");
	return Number.isFinite(declared) && declared > maxBytes;
}

const SAFE_METHODS: Record<string, true> = {
	GET: true,
	HEAD: true,
	OPTIONS: true,
};

// Rejects unsafe requests whose body is not JSON or is declared too large.
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

		if (declaredBodyTooLarge(c, MAX_JSON_BODY_BYTES)) {
			throw new ApiFailure("PAYLOAD_TOO_LARGE");
		}

		return next();
	},
);
