import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/projects/")({
	beforeLoad: () => {
		throw redirect({ to: "/vendor/opportunities" });
	},
});
