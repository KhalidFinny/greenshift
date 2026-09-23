import type { AuthUser } from "@greenshift/core";
import type { SessionPayload } from "./lib/session";

// The slice of the Workers AI binding this worker calls. Declared structurally
// because the installed `@cloudflare/workers-types` no longer exports the class.
export interface AiBinding {
	run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
	/** Turns a filed document (PDF or image) into text; the verification scan is the only caller. */
	toMarkdown(file: {
		name: string;
		blob: Blob;
	}): Promise<
		| { format: "markdown" | "text"; data: string; tokens: number }
		| { format: "error"; error: string }
	>;
}

/** Worker bindings, mirroring the bindings declared in wrangler.jsonc. */
export interface Env {
	DB: D1Database;
	KV: KVNamespace;
	R2: R2Bucket;
	// Workers AI writes Eleanor's risk narrative on the review step; without it
	// the deterministic analyst in `modules/business/risk/eleanor.service.ts` composes the same reading.
	AI?: AiBinding;
	// Inactivity timeout in minutes before a session is invalidated; defaults to
	// 15 minutes when unset (see lib/session.ts).
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
