import { useRouterState } from "@tanstack/react-router";

/** True only on the landing page, read from the *committed* route match: a
 * `location.pathname` check flips a frame early and races the view transition. */
export function useIsHome() {
	const routeId = useRouterState({
		select: (state) => state.matches[state.matches.length - 1]?.routeId,
	});
	return routeId === "/";
}
