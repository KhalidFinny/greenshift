import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../env";

const SAFE_METHODS: Record<string, true> = {
	GET: true,
	HEAD: true,
	OPTIONS: true,
};

export const CSRF_HEADER = "x-csrf-token";

function requestOrigin(c: Context<ApiEnv>): string {
	return new URL(c.req.url).origin;
}

function sameOrigin(c: Context<ApiEnv>): boolean {
	const expected = requestOrigin(c);
	const origin = c.req.header("origin");
	if (origin) return origin === expected;

	const referer = c.req.header("referer");
	if (!referer) return false;
	try {
		return new URL(referer).origin === expected;
	} catch {
		return false;
	}
}

export const requireCsrf = createMiddleware<ApiEnv>(
	async (c: Context<ApiEnv>, next: Next) => {
		if (SAFE_METHODS[c.req.method.toUpperCase()]) {
			await next();
			return;
		}

		const site = (c.req.header("sec-fetch-site") ?? "").toLowerCase();
		if (site && site !== "same-origin") {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Cross-origin request rejected",
					},
				},
				403,
			);
		}

		if (!sameOrigin(c)) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Invalid origin",
					},
				},
				403,
			);
		}

		const token = c.req.header(CSRF_HEADER);
		const session = c.get("session");
		if (!session || !token || token !== session.csrfToken) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Invalid CSRF token",
					},
				},
				403,
			);
		}

		await next();
	},
);
