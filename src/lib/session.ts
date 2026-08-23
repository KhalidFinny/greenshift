import {
	getSessionUser,
	readCookie,
	SESSION_COOKIE,
} from "@greenshift/api/lib/session";
import type { AuthUser } from "@greenshift/core";
import { createServerFn } from "@tanstack/react-start";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async ({ context }): Promise<AuthUser | null> => {
		const { request, cloudflare } = context;
		return getSessionUser(
			cloudflare.env,
			readCookie(request.headers.get("cookie"), SESSION_COOKIE),
		);
	},
);
