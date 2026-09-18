import type { AuthUser } from "@greenshift/core";
import { getContext } from "@greenshift/core";
import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
	queryClient: QueryClient;
	user: AuthUser | null;
}

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context: {
			...context,
			user: null as AuthUser | null,
		} satisfies RouterContext,
		scrollRestoration: true,
		// Native cross-fade between routes instead of an instant swap. Falls
		// back to a plain swap when the browser lacks the View Transitions API.
		defaultViewTransition: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
