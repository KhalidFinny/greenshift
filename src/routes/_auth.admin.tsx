import { requireRole, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin")({
	beforeLoad: requireRole("admin"),
	component: () => (
		<RoleShell title="Admin" navItems={roleNav.admin}>
			<Outlet />
		</RoleShell>
	),
});
