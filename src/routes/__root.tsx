import { TanStackQueryDevtools } from "@greenshift/core";
import { Footer, Header, useIsHome } from "@greenshift/ui";
import appCss from "@greenshift/ui/styles.css?url";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
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
			{ title: "GreenShift — Platform MRV untuk Pembiayaan Hijau" },
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
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = useIsHome();
	const isAuthPage = pathname === "/login" || pathname === "/register";

	return (
		<html lang="id" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="bg-background font-sans text-foreground antialiased [overflow-wrap:anywhere] selection:bg-secondary selection:text-foreground">
				{isAuthPage ? null : (
					<Header variant={isHome ? "transparent" : "default"} />
				)}
				{children}
				{isAuthPage ? null : <Footer />}
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
