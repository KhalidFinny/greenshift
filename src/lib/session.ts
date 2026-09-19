import { createDb, users } from "@greenshift/api";
import { authUserFrom } from "@greenshift/api/lib/authz";
import {
	getSessionUser,
	readCookie,
	SESSION_COOKIE,
} from "@greenshift/api/lib/session";
import type { AuthUser } from "@greenshift/core";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async ({ context }): Promise<AuthUser | null> => {
		const { request, cloudflare } = context;
		const session = await getSessionUser(
			cloudflare.env,
			readCookie(request.headers.get("cookie"), SESSION_COOKIE),
		);
		if (!session) return null;

		const db = createDb(cloudflare.env.DB);
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId))
			.limit(1);
		if (!user) return null;

		return authUserFrom(user);
	},
);
