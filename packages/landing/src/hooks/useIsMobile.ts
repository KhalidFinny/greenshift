import { useSyncExternalStore } from "react";

/** The width where the desktop landing stops working: its hero is one rigid canvas. */
const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
	const query = window.matchMedia(MOBILE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

/**
 * True on a phone-sized viewport. `initial` is the server's user-agent verdict, so
 * the first paint is already the right composition; after hydration the live
 * media query takes over, which is what makes a resize or a rotation reflow.
 */
export function useIsMobile(initial = false): boolean {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(MOBILE_QUERY).matches,
		() => initial,
	);
}
