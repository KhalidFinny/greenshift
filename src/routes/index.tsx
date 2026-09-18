import { getDevRole } from "@greenshift/core";
import {
	CtaSection,
	EcosystemSection,
	FaqSection,
	HeroSection,
	HowItWorksSection,
} from "@greenshift/landing";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		if (getDevRole()) throw redirect({ to: "/login" });
	},
	component: () => (
		<main>
			<HeroSection />
			<HowItWorksSection />
			<EcosystemSection />
			<FaqSection />
			<CtaSection />
		</main>
	),
});
