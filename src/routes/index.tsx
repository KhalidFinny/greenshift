import { getDevRole } from "@greenshift/core";
import {
	CaraKerjaSection,
	CtaSection,
	EkosistemSection,
	FaqSection,
	HeroSection,
} from "@greenshift/landing";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		if (getDevRole()) throw redirect({ to: "/login" });
	},
	component: () => (
		<main>
			<HeroSection />
			<CaraKerjaSection />
			<EkosistemSection />
			<FaqSection />
			<CtaSection />
		</main>
	),
});
