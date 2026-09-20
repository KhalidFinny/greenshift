import type { AuthUser } from "@greenshift/core";
import type { SessionPayload } from "./lib/session";

/**
 * The slice of the Workers AI binding this worker calls. Declared structurally
 * because the installed `@cloudflare/workers-types` no longer exports the
 * binding class, and this is the only method Eleanor uses.
 */
export interface AiBinding {
	run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

/**
 * Cloudflare Worker bindings for the GreenShift worker.
 * Mirrors the bindings declared in wrangler.jsonc.
 */
export interface Env {
	DB: D1Database;
	KV: KVNamespace;
	R2: R2Bucket;
	/**
	 * Workers AI, which writes Eleanor's risk narrative on the review step.
	 * Optional: without it the deterministic analyst in
	 * `modules/business/risk/eleanor.service.ts` composes the same reading.
	 */
	AI?: AiBinding;
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
