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

// Hono context for the API: bindings plus the authenticated user, populated
// by the requireSession middleware (apps/api/src/lib/authz.ts).
export interface ApiEnv {
	Bindings: Env;
	Variables: { user: AuthUser };
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
