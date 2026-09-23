import { useInView } from "../../hooks/useInView";
import { useMouseParallax } from "../../hooks/useMouseParallax";
import { useStepper } from "../../hooks/useStepper";
import PartnerAppsShowcase from "../molecules/PartnerAppsShowcase";

/**
 * What a step shows beside its copy: a real screen of the product, or the
 * partners the step happens with. The monitoring step is the second kind: the
 * bond is issued and held outside GreenShift, so that step names the apps
 * instead of showing a dashboard the platform does not own.
 */
type StepVisual =
	| {
			kind: "image";
			src: string;
			width: number;
			height: number;
			alt: string;
	  }
	| { kind: "partners" };

const steps: Array<{
	id: string;
	stepLabel: string;
	title: string;
	description: string;
	visual: StepVisual;
}> = [
	{
		id: "01",
		stepLabel: "Validate",
		title: "Start with Ease",
		description:
			"Simply fill in your company profile and upload supporting documents such as electricity bills, energy audits, and other operational data. Our system validates every piece of information automatically so the process stays fast, transparent, and hassle-free.",
		// Each step shows the real screen it describes: the submission wizard, its
		// review step, and the catalog the funding reaches. All three are 16:9,
		// and the stored size is declared so the frame keeps its height while a
		// swapped image is still loading.
		visual: {
			kind: "image",
			src: "/wizard-project-profile.webp",
			width: 1440,
			height: 810,
			alt: "Step 1 of the project submission wizard, showing the project profile form, the current energy situation, and the emission reduction target summary.",
		},
	},
	{
		id: "02",
		stepLabel: "Prepare",
		title: "Prepare the Best Strategy",
		description:
			"The GreenShift team builds a technical blueprint and financial model tailored to your project's needs. From feasibility analysis to implementation planning, everything is designed to keep the project efficient and deliver real impact.",
		visual: {
			kind: "image",
			src: "/wizard-review-submit.webp",
			width: 1440,
			height: 810,
			alt: "The review and submit step of the wizard, showing the project and financial summary, an analysis by Eleanor, and a chart of CAPEX against annual revenue and saving.",
		},
	},
	{
		id: "03",
		stepLabel: "Fund",
		title: "Secure Funding",
		description:
			"Projects that have been validated and well structured are ready to attract our investment partners. We bridge your financing needs with a network of investors committed to a sustainable energy transition.",
		visual: {
			kind: "image",
			src: "/bond-catalog.webp",
			width: 1440,
			height: 810,
			alt: "The public bond catalog, listing verified projects with their risk level, emission target, and the reductions their reporting periods measured.",
		},
	},
	{
		id: "04",
		stepLabel: "Monitor",
		title: "Monitor with Confidence",
		description:
			"Every project reports its measured energy saving and carbon reduction period by period, checked against the baseline it was verified on, and flagged the moment a period deviates from it. The bond itself is issued, sold and held by a licensed securities partner, whose app is where the investment is followed.",
		visual: { kind: "partners" },
	},
];

/** Loads the other steps' screenshots so a click does not wait on the network. */
function preloadStepImages() {
	for (const step of steps) {
		if (step.visual.kind !== "image") continue;
		const preload = new Image();
		preload.src = step.visual.src;
	}
}

/** The frame every step's visual sits in, so the panel matches the screenshots. */
function StepVisualFrame({ step }: { step: (typeof steps)[number] }) {
	if (step.visual.kind === "partners") {
		return <PartnerAppsShowcase />;
	}

	return (
		<figure className="m-0">
			<div className="rounded-[16px] border border-[#CDDAD5] bg-white p-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
				<img
					key={step.id}
					src={step.visual.src}
					alt={step.visual.alt}
					width={step.visual.width}
					height={step.visual.height}
					loading="lazy"
					decoding="async"
					className="w-full rounded-[12px] animate-in fade-in duration-300 motion-reduce:animate-none"
				/>
			</div>
		</figure>
	);
}

export default function HowItWorksSection() {
	const { activeStep, setActiveStep } = useStepper(steps.length);
	const imageRef = useMouseParallax<HTMLDivElement>({ intensity: 0.025 });
	const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0.1 });
	const step = steps[activeStep];

	return (
		<section
			id="how-it-works"
			ref={ref}
			className="relative overflow-hidden bg-white"
		>
			<div className="page-wrap relative z-10 py-24">
				<header className="mb-12 max-w-2xl">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-[#03442C]">
						How It Works
					</p>
					<h2 className="mt-4 text-[36px] font-bold leading-tight text-[#1C1C1C]">
						Steps Toward the Energy Transition
					</h2>
				</header>

				<nav
					className="mb-20 flex flex-wrap items-start"
					aria-label="Process steps"
				>
					{steps.map((entry, index) => (
						<div key={entry.id} className="flex items-start">
							<button
								type="button"
								onClick={() => setActiveStep(index)}
								onPointerEnter={preloadStepImages}
								onFocus={preloadStepImages}
								aria-pressed={activeStep === index}
								className="flex flex-col items-center cursor-pointer px-4"
							>
								<span
									className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold transition-all duration-500 motion-reduce:transition-none"
									style={{
										backgroundColor:
											activeStep === index ? "#00712D" : "transparent",
										color: activeStep === index ? "#fff" : "#03442C",
										border: activeStep === index ? "none" : "2px solid #03442C",
									}}
								>
									{entry.id}
								</span>
								<span
									className="mt-3 text-base font-semibold transition-colors duration-300 motion-reduce:transition-none"
									style={{
										color: activeStep === index ? "#03442C" : "#555555",
									}}
								>
									{entry.stepLabel}
								</span>
							</button>
							{index < steps.length - 1 && (
								<div
									className="mt-6 h-px w-12 bg-[#CDDAD5]"
									aria-hidden="true"
								/>
							)}
						</div>
					))}
				</nav>

				<div
					className={`grid grid-cols-1 items-start gap-12 transition-all duration-700 motion-reduce:transition-none lg:grid-cols-[1fr_1.5fr] lg:gap-20 ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}
				>
					<article id={`step-panel-${step.id}`}>
						<h3 className="text-[32px] font-bold leading-[1.2] text-[#1C1C1C]">
							{step.title}
						</h3>
						<p className="mt-6 text-[22px] leading-[1.8] text-[#555]">
							{step.description}
						</p>
					</article>

					<div
						ref={imageRef}
						className="will-change-transform motion-reduce:!transform-none"
					>
						<StepVisualFrame step={step} />
					</div>
				</div>
			</div>
		</section>
	);
}
