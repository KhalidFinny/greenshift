import type { RegisterBody } from "@greenshift/api/contracts";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { api } from "../api/client";
import { clearStoredToasts } from "../toast-bus";
import type { AuthUser } from "./types";

export function useAuth() {
	const router = useRouter();
	const user = useRouteContext({ from: "__root__", select: (ctx) => ctx.user });

	async function login(email: string, password: string): Promise<AuthUser> {
		const { user: loggedIn } = await api.auth.login(email, password);
		await router.invalidate();
		return loggedIn;
	}

	async function register(input: RegisterBody): Promise<AuthUser> {
		const { user: registered } = await api.auth.register(input);
		await router.invalidate();
		return registered;
	}

	async function logout(silent = false): Promise<void> {
		await api.auth.logout(silent);
		// The queue outlives the page on purpose, so it is dropped here rather
		// than left for whoever signs in next on this tab.
		clearStoredToasts();
		await router.invalidate();
	}

	return { user, login, register, logout };
}
