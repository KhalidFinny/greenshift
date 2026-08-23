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
import { getSessionFn } from "../lib/session";
import type { RouterContext } from "../router";

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('dark');root.classList.add('light');root.setAttribute('data-theme','light');root.style.colorScheme='light';window.localStorage.setItem('theme','light');}catch(e){}})();`;

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
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const isHome = useIsHome();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isAuthPage = pathname === "/login" || pathname === "/register";

	return (
		<html lang="id" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="bg-background font-sans text-foreground antialiased [overflow-wrap:anywhere] selection:bg-secondary selection:text-foreground">
				{isAuthPage ? null : (
					<Header variant={isHome ? "transparent" : "default"} />
				)}
				{children}
				{isAuthPage ? null : <Footer />}
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
				<Scripts />
			</body>
		</html>
	);
}
