import CtaSection from "./components/organisms/CtaSection";
import EcosystemSection from "./components/organisms/EcosystemSection";
import FaqSection from "./components/organisms/FaqSection";
import HeroSection from "./components/organisms/HeroSection";
import HowItWorksSection from "./components/organisms/HowItWorksSection";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileLanding from "./mobile/MobileLanding";

/** One tree per form factor, chosen from the server's user-agent read so the right one is painted first. */
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
