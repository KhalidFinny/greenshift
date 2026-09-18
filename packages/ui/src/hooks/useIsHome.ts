import { useRouterState } from "@tanstack/react-router";

/**
 * True only on the landing page, read from the *committed* route match.
 *
 * The router updates `location` as soon as navigation starts, but swaps the
 * rendered `matches` inside `startViewTransition`. A `location.pathname` check
 * therefore flips a frame early: the header unmounts before the outgoing page
 * fades, so it visibly "races" the transition. Reading the committed match
 * keeps the header mounted until the page actually swaps, so both fade as one.
 */
export function useIsHome() {
	const routeId = useRouterState({
		select: (state) => state.matches[state.matches.length - 1]?.routeId,
	});
	return routeId === "/";
}
