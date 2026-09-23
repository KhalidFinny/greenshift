import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { GettingStartedCard } from "@greenshift/vendor";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

export const Route = createFileRoute("/_auth/vendor")({
	beforeLoad: requireRole("vendor"),
	component: () => (
		<RoleShell
			title="Vendor"
			navItems={roleNav.vendor}
			tutorial={<GettingStartedCard />}
		>
			<Outlet />
		</RoleShell>
	),
	notFoundComponent: NotFoundComponent,
});
