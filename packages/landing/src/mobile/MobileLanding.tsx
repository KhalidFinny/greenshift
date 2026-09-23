import MobileFaq from "./MobileFaq";
import MobileHero from "./MobileHero";
import MobileSteps from "./MobileSteps";

/** The phone landing is its own composition, not the desktop canvas scaled down. */
export default function MobileLanding() {
	return (
		<main className="overflow-x-hidden bg-white">
			<MobileHero />
			<MobileSteps />
			<MobileFaq />
		</main>
	);
}
