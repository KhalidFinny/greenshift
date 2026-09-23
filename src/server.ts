import type { Env } from "@greenshift/api";
import { app } from "@greenshift/api";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";

const startHandler = createStartHandler(defaultStreamHandler);

// Applied to every response (API + SSR). Prod must allow inline scripts: TanStack
// Start's streaming SSR emits a nonce-less stream-barrier script, and React escapes dynamic text.
const SECURITY_HEADERS: Record<string, string> = import.meta.env.DEV
	? {
			// Dev relaxes script/style and allows the Vite HMR websocket + devtools.
			"Content-Security-Policy":
				"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"X-Frame-Options": "DENY",
			"Permissions-Policy":
				"camera=(), microphone=(), geolocation=(), payment=(), usb=()",
		}
	: {
			"Content-Security-Policy":
				"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
			"Strict-Transport-Security":
				"max-age=63072000; includeSubDomains; preload",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"X-Frame-Options": "DENY",
			"Permissions-Policy":
				"camera=(), microphone=(), geolocation=(), payment=(), usb=()",
		};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		try {
			const url = new URL(request.url);
			const isApi = url.pathname === "/api" || url.pathname.startsWith("/api/");

			const response = isApi
				? await app.fetch(request, env, ctx)
				: await startHandler(request, {
						context: { request, cloudflare: { env, ctx } },
					});

			for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
				response.headers.set(name, value);
			}
			return response;
		} catch (err) {
			// Last-resort boundary: sanitized 500, headers still applied.
			console.error("[worker]", err);
			const response = new Response(
				JSON.stringify({
					error: { code: "INTERNAL", message: "Internal server error" },
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
			for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
				response.headers.set(name, value);
			}
			return response;
		}
	},
};
