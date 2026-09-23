import MobileFaq from "./MobileFaq";
import MobileHero from "./MobileHero";
import MobileSteps from "./MobileSteps";

/**
 * The landing on a phone: its own composition, not the desktop canvas scaled down.
 * The desktop hero is one rigid 1920px canvas with parallax and looping pills, and
 * squeezing it into 390px is what made the phone view read as broken. Here the
 * dials are the app's (ENERGY 1 / RHYTHM 2 / MOTION 1): solid surfaces, no
 * parallax, no loops, and every action a 44px target.
 */
export default function MobileLanding() {
	return (
		<main className="overflow-x-hidden bg-white">
			<MobileHero />
			<MobileSteps />
			<MobileFaq />
		</main>
	);
}
