import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business")({
	beforeLoad: requireRole("business"),
	component: () => (
		<RoleShell title="Business" navItems={roleNav.business}>
			<Outlet />
		</RoleShell>
	),
});
