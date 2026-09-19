import type { AuthUser } from "@greenshift/core";
import type { SessionPayload } from "./lib/session";

/**
 * Cloudflare Worker bindings for the GreenShift worker.
 * Mirrors the bindings declared in wrangler.jsonc.
 */
export interface Env {
	DB: D1Database;
	KV: KVNamespace;
	R2: R2Bucket;
	/**
	 * Inactivity timeout in minutes before a session is invalidated.
	 * Optional: defaults to 2 minutes when unset (see lib/session.ts).
	 */
	SESSION_IDLE_MINUTES?: string;
}

// Hono context for the API: bindings plus the authenticated user/session,
// populated by the requireSession middleware.
export interface ApiEnv {
	Bindings: Env;
	Variables: {
		user: AuthUser;
		session: SessionPayload;
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
