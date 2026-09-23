import { buttonVariants } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

/**
 * The phone hero: the deep-green band, one headline, two actions, then the real
 * wizard screen. No parallax and no absolutely positioned canvas, because the
 * phone composition is laid out at the phone's own width.
 */
export default function MobileHero() {
	return (
		<section id="hero" className="bg-white">
			<div className="bg-[#03442C] px-5 pt-14 pb-12 text-white">
				<h1 className="max-w-[22ch] text-[30px] font-bold leading-[1.15]">
					Sustainable Finance for a Greener Future.
				</h1>
				<p className="mt-4 max-w-[38ch] text-base leading-relaxed text-emerald-50">
					GreenShift measures what an industrial energy project actually cuts,
					verifies it against the target its blueprint promised, and hands the
					bond to a licensed securities partner.
				</p>

				<div className="mt-8 flex flex-col gap-3">
					<Link
						to="/register"
						className={buttonVariants({
							size: "lg",
							className:
								"h-12 w-full justify-center bg-white text-base font-semibold text-[#03442C] hover:bg-emerald-50",
						})}
					>
						Register your company
					</Link>
					<Link
						to="/bonds"
						className={buttonVariants({
							variant: "outline",
							size: "lg",
							className:
								"h-12 w-full justify-center border-white/40 bg-transparent text-base font-semibold text-white hover:bg-white/10 hover:text-white",
						})}
					>
						Browse the bond catalog
					</Link>
				</div>
			</div>

			<figure className="m-0 px-5 pt-10">
				<div className="overflow-hidden rounded-[14px] border border-[#CDDAD5] bg-white p-1.5">
					<img
						src="/wizard-project-profile.webp"
						alt="Step one of the GreenShift project submission wizard: the project profile form, the current energy situation, and the emission reduction target summary"
						width={1440}
						height={810}
						decoding="async"
						className="w-full rounded-[10px]"
					/>
				</div>
				<figcaption className="mt-3 text-sm leading-relaxed text-[#555]">
					Where a company starts: the submission wizard, one project at a time.
				</figcaption>
			</figure>
		</section>
	);
}
