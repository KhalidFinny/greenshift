import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor")({
	beforeLoad: requireRole("vendor"),
	component: () => (
		<RoleShell title="Vendor" navItems={roleNav.vendor}>
			<Outlet />
		</RoleShell>
	),
});
