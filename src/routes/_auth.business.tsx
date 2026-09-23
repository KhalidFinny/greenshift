import { requireRole, requireVerifiedCompany, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

export const Route = createFileRoute("/_auth/business")({
	beforeLoad: (options) => {
		requireRole("business")(options);
		// An unverified company is held here: every other business screen answers with refused requests.
		requireVerifiedCompany(options);
	},
	component: () => (
		<RoleShell title="Company" navItems={roleNav.business}>
			<Outlet />
		</RoleShell>
	),
	notFoundComponent: NotFoundComponent,
});
