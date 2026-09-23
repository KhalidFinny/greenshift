import PartnerAppsShowcase from "../components/molecules/PartnerAppsShowcase";
import { howItWorksSteps, landingFacts } from "../content/landing";

/**
 * The phone version of How It Works: a vertical timeline where every step's copy
 * and screen are on the page at once. The desktop stepper is click-to-switch, and
 * a phone should not have to tap four times to read four steps.
 */
export default function MobileSteps() {
	return (
		<>
			<section id="what-we-measure" className="bg-[#F8F9F7] px-5 py-14">
				<h2 className="text-[24px] font-bold leading-tight text-[#1C1C1C]">
					What the platform measures
				</h2>
				<ul className="mt-6 space-y-6">
					{landingFacts.map((fact) => (
						<li key={fact.title} className="border-t border-[#CDDAD5] pt-5">
							<h3 className="text-base font-semibold text-[#1C1C1C]">
								{fact.title}
							</h3>
							<p className="mt-2 text-base leading-relaxed text-[#555]">
								{fact.body}
							</p>
						</li>
					))}
				</ul>
			</section>

			<section id="how-it-works" className="bg-white px-5 py-14">
				<h2 className="text-[24px] font-bold leading-tight text-[#1C1C1C]">
					Steps Toward the Energy Transition
				</h2>

				<ol className="mt-8 space-y-10">
					{howItWorksSteps.map((step) => (
						<li key={step.id} className="relative pl-12">
							<span
								aria-hidden
								className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full bg-[#00712D] text-sm font-bold text-white"
							>
								{step.id}
							</span>
							<p className="text-sm font-bold uppercase tracking-[0.14em] text-[#03442C]">
								{step.stepLabel}
							</p>
							<h3 className="mt-2 text-[20px] font-bold leading-snug text-[#1C1C1C]">
								{step.title}
							</h3>
							<p className="mt-3 text-base leading-relaxed text-[#555]">
								{step.description}
							</p>

							<div className="mt-5">
								{step.visual.kind === "partners" ? (
									<PartnerAppsShowcase />
								) : (
									<figure className="m-0">
										<div className="overflow-hidden rounded-[14px] border border-[#CDDAD5] bg-white p-1.5">
											<img
												src={step.visual.src}
												alt={step.visual.alt}
												width={step.visual.width}
												height={step.visual.height}
												loading="lazy"
												decoding="async"
												className="w-full rounded-[10px]"
											/>
										</div>
									</figure>
								)}
							</div>
						</li>
					))}
				</ol>
			</section>
		</>
	);
}
