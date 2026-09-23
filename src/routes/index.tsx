import { getDevRole } from "@greenshift/core";
import { LandingPage } from "@greenshift/landing";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getIsMobileFn } from "../lib/viewport";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		if (getDevRole()) throw redirect({ to: "/login" });
		return { mobile: await getIsMobileFn() };
	},
	component: () => {
		const { mobile } = Route.useRouteContext();
		return <LandingPage initialMobile={mobile} />;
	},
});
