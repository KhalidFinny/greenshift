import { createServerFn } from "@tanstack/react-start";

/** Resolved before first paint, or a phone flashes the desktop canvas before the swap. */
export const getIsMobileFn = createServerFn({ method: "GET" }).handler(
	async ({ context }): Promise<boolean> => {
		const userAgent = context.request.headers.get("user-agent") ?? "";
		return /Android|iPhone|iPod|Windows Phone|Mobile/i.test(userAgent);
	},
);
