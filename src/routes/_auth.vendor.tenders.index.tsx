import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/tenders/")({
	beforeLoad: () => {
		throw redirect({ to: "/vendor/deals" });
	},
});
