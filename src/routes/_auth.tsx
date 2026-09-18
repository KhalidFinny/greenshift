import {
	getDevRole,
	getDevScope,
	useIdleSessionExpiry,
} from "@greenshift/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

function AuthShell() {
	// Session inactivity timeout: after the idle window without activity the
	// app logs out and bounces to /login (server also invalidates idle
	// sessions on KV: default 15 min, tunable via SESSION_IDLE_MINUTES).
	useIdleSessionExpiry();
	return <Outlet />;
}

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context }) => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const devRole = getDevRole();
		if (!context.user) throw redirect({ to: "/login" });
		if (devRole && context.user.role !== devRole)
			throw redirect({ to: "/login" });
	},
	component: () => <AuthShell />,
	notFoundComponent: NotFoundComponent,
});
