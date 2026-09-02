import type { AuthUser } from "@greenshift/core";

/**
 * Cloudflare Worker bindings for the GreenShift worker.
 * Mirrors the bindings declared in wrangler.jsonc.
 */
export interface Env {
	DB: D1Database;
	KV: KVNamespace;
	R2: R2Bucket;
}

// Hono context for the API: bindings plus the authenticated user/session,
// populated by the requireSession middleware.
export interface ApiEnv {
	Bindings: Env;
	Variables: {
		user: AuthUser;
		session: { userId: number; csrfToken: string; stepUpUntil: number | null };
		sessionToken: string;
	};
}

declare module "@tanstack/router-core" {
	interface Register {
		server: {
			requestContext: {
				request: Request;
				cloudflare: {
					env: Env;
					ctx: ExecutionContext;
				};
			};
		};
	}
}
