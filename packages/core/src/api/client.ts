import {
	type AuthResponse,
	apiRoutes,
	type LoginBody,
	type OkResponse,
	type RegisterBody,
} from "@greenshift/api/contracts";
import type { AuthUser } from "../auth/types";
import { request } from "./http";

/**
 * Typed client for the single GreenShift API.
 * Paths, methods, and body shapes come from the shared contract in
 * @greenshift/api — nothing API-related is hardcoded here.
 */
export const api = {
	auth: {
		login: (email: string, password: string) =>
			request<AuthResponse>(apiRoutes.login.path, {
				method: apiRoutes.login.method,
				body: JSON.stringify({ email, password } satisfies LoginBody),
			}),
		register: (
			name: string,
			email: string,
			password: string,
			companyName: string,
		) =>
			request<AuthResponse>(apiRoutes.register.path, {
				method: apiRoutes.register.method,
				body: JSON.stringify({
					name,
					email,
					password,
					companyName,
				} satisfies RegisterBody),
			}),
		me: () => request<AuthResponse>(apiRoutes.me.path),
		logout: () =>
			request<OkResponse>(apiRoutes.logout.path, {
				method: apiRoutes.logout.method,
			}),
	},
};

export type { AuthUser };
