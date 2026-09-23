import { createServerFn } from "@tanstack/react-start";

/**
 * Whether the request came from a phone. The landing has two compositions and the
 * choice has to be made before the first paint, or a phone renders the desktop
 * canvas for a frame and then swaps it.
 */
export const getIsMobileFn = createServerFn({ method: "GET" }).handler(
	async ({ context }): Promise<boolean> => {
		const userAgent = context.request.headers.get("user-agent") ?? "";
		return /Android|iPhone|iPod|Windows Phone|Mobile/i.test(userAgent);
	},
);
