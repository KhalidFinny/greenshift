import { TanStackQueryDevtools } from "@greenshift/core";
import { Footer, Header, ToastProvider, useIsHome } from "@greenshift/ui";
import appCss from "@greenshift/ui/styles.css?url";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { NotFoundComponent } from "../components/not-found";
import { getSessionFn } from "../lib/session";
import type { RouterContext } from "../router";

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async () => {
		return { user: await getSessionFn() };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "GreenShift: MRV Platform for Green Financing" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/logo-short.svg" },
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFoundComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const isHome = useIsHome();
	// Decide public chrome from the committed route tree, not from pathname +
	// auth context: during a transition out of an authed page the session is
	// already cleared while the route is still the old one: a pathname/user
	// mix would flash the public header for a frame.
	const activeRouteId = useRouterState({
		select: (state) => state.matches[state.matches.length - 1]?.routeId,
	});
	const isPublicPage = activeRouteId
		? !activeRouteId.startsWith("/_auth") &&
			activeRouteId !== "/login" &&
			activeRouteId !== "/register"
		: true;
	// The bonds dashboard is a self-contained public surface: no site footer.
	const isBondsPage = activeRouteId?.startsWith("/bonds") ?? false;

	// Pick the view-transition variant. Defaults to "fade-through" (no asset
	// overlap); override live with ?vt=slide-fade|zoom-fade to A/B.
	useEffect(() => {
		const variant = new URLSearchParams(window.location.search).get("vt");
		document.documentElement.dataset.vt = variant ?? "fade-through";
	}, []);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="bg-background font-sans text-foreground antialiased [overflow-wrap:anywhere] selection:bg-secondary selection:text-foreground">
				{isHome ? <Header /> : null}
				<ToastProvider>{children}</ToastProvider>
				{isPublicPage && !isBondsPage ? <Footer /> : null}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{ position: "bottom-right" }}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}
