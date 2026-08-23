import type { Env } from "@greenshift/api";
import { app } from "@greenshift/api";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";

const startHandler = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/api")) {
			return app.fetch(request, env, ctx);
		}

		return startHandler(request, {
			context: { request, cloudflare: { env, ctx } },
		});
	},
};
