import CtaSection from "./components/organisms/CtaSection";
import EcosystemSection from "./components/organisms/EcosystemSection";
import FaqSection from "./components/organisms/FaqSection";
import HeroSection from "./components/organisms/HeroSection";
import HowItWorksSection from "./components/organisms/HowItWorksSection";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileLanding from "./mobile/MobileLanding";

/**
 * The landing owns its own composition: one design for a wide canvas, one for a
 * phone. They are separate trees, so neither has to compromise for the other and
 * only one of them is in the document at a time. `initialMobile` comes from the
 * server's user-agent read, so the right tree is the first one painted.
 */
export default function LandingPage({
	initialMobile = false,
}: {
	initialMobile?: boolean;
}) {
	return useIsMobile(initialMobile) ? (
		<MobileLanding />
	) : (
		<main>
			<HeroSection />
			<HowItWorksSection />
			<EcosystemSection />
			<FaqSection />
			<CtaSection />
		</main>
	);
}
