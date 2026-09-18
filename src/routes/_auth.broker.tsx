import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

export const Route = createFileRoute("/_auth/broker")({
	beforeLoad: requireRole("broker"),
	component: () => (
		<RoleShell title="Broker" navItems={roleNav.broker}>
			<Outlet />
		</RoleShell>
	),
	notFoundComponent: NotFoundComponent,
});
