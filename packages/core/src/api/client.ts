import type { AuthUser } from "../auth/types";
import { request } from "./http";

/**
 * Typed client for the single GreenShift API.
 * All paths are relative — the API lives in the same worker/origin.
 */
export const api = {
	auth: {
		login: (email: string, password: string) =>
			request<{ user: AuthUser }>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			}),
		me: () => request<{ user: AuthUser }>("/api/auth/me"),
		logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
	},
};
