import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/active-projects/")({
	beforeLoad: () => {
		throw redirect({ to: "/vendor/deals" });
	},
});
