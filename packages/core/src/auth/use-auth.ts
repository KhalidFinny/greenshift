import { useRouteContext, useRouter } from "@tanstack/react-router";

import { api } from "../api/client";
import type { AuthUser } from "./types";

export function useAuth() {
	const router = useRouter();
	const user = useRouteContext({ from: "__root__", select: (ctx) => ctx.user });

	async function login(email: string, password: string): Promise<AuthUser> {
		const { user: loggedIn } = await api.auth.login(email, password);
		await router.invalidate();
		return loggedIn;
	}

	async function logout(): Promise<void> {
		await api.auth.logout();
		await router.invalidate();
	}

	return { user, login, logout };
}
