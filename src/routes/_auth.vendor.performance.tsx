import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/performance")({
	beforeLoad: () => {
		throw redirect({ to: "/vendor/portfolio-performance" });
	},
});
