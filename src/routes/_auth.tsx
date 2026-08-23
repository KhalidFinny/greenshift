import { getDevRole, getDevScope } from "@greenshift/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context }) => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const devRole = getDevRole();
		if (!context.user) throw redirect({ to: "/login" });
		if (devRole && context.user.role !== devRole)
			throw redirect({ to: "/login" });
	},
	component: () => <Outlet />,
});
