import type { Env } from "@greenshift/api";

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
