import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

export const Route = createFileRoute("/_auth/investor")({
	beforeLoad: requireRole("investor"),
	component: () => (
		<RoleShell title="Investor" navItems={roleNav.investor}>
			<Outlet />
		</RoleShell>
	),
	notFoundComponent: NotFoundComponent,
});
