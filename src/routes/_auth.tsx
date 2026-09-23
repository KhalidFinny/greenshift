import {
	getDevRole,
	getDevScope,
	useIdleSessionExpiry,
} from "@greenshift/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

function AuthShell() {
	// Idle timeout: after the window without activity the app logs out to /login; the
	// server invalidates idle KV sessions too (default 15 min, SESSION_IDLE_MINUTES).
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
