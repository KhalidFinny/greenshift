/**
 * Cloudflare Worker bindings for the GreenShift worker.
 * Mirrors the bindings declared in wrangler.jsonc.
 */
export interface Env {
	DB: D1Database;
	KV: KVNamespace;
	R2: R2Bucket;
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
