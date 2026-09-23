import { requireRole, requireVerifiedCompany, roleNav } from "@greenshift/core";
import { RoleShell } from "@greenshift/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundComponent } from "../components/not-found";

export const Route = createFileRoute("/_auth/business")({
	beforeLoad: (options) => {
		requireRole("business")(options);
		// A company that has not been verified is held on the verification step:
		// every other business screen would answer with refused requests.
		requireVerifiedCompany(options);
	},
	component: () => (
		<RoleShell title="Company" navItems={roleNav.business}>
			<Outlet />
		</RoleShell>
	),
	notFoundComponent: NotFoundComponent,
});
