import { useInView } from "../../hooks/useInView";
import { useMouseParallax } from "../../hooks/useMouseParallax";
import { useStepper } from "../../hooks/useStepper";

const steps = [
	{
		id: "01",
		stepLabel: "Validate",
		title: "Start with Ease",
		description:
			"Simply fill in your company profile and upload supporting documents such as electricity bills, energy audits, and other operational data. Our system validates every piece of information automatically so the process stays fast, transparent, and hassle-free.",
	},
	{
		id: "02",
		stepLabel: "Prepare",
		title: "Prepare the Best Strategy",
		description:
			"The GreenShift team builds a technical blueprint and financial model tailored to your project's needs. From feasibility analysis to implementation planning, everything is designed to keep the project efficient and deliver real impact.",
	},
	{
		id: "03",
		stepLabel: "Fund",
		title: "Secure Funding",
		description:
			"Projects that have been validated and well structured are ready to attract our investment partners. We bridge your financing needs with a network of investors committed to a sustainable energy transition.",
	},
	{
		id: "04",
		stepLabel: "Monitor",
		title: "Monitor with Confidence",
		description:
			"Access a real-time dashboard to track project performance, investment returns, and carbon emission reduction impact. All data is available in one place so you can make the right decisions at any time.",
	},
];

export default function HowItWorksSection() {
	const { activeStep, setActiveStep } = useStepper(steps.length);
	const imageRef = useMouseParallax<HTMLDivElement>({ intensity: 0.025 });
	const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0.1 });

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
					{steps.map((step, index) => (
						<div key={step.id} className="flex items-start">
							<button
								type="button"
								onClick={() => setActiveStep(index)}
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
									{step.id}
								</span>
								<span
									className="mt-3 text-base font-semibold transition-colors duration-300 motion-reduce:transition-none"
									style={{
										color: activeStep === index ? "#03442C" : "#555555",
									}}
								>
									{step.stepLabel}
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
					<article id={`step-panel-${steps[activeStep].id}`}>
						<h3 className="text-[32px] font-bold leading-[1.2] text-[#1C1C1C]">
							{steps[activeStep].title}
						</h3>
						<p className="mt-6 text-[22px] leading-[1.8] text-[#555]">
							{steps[activeStep].description}
						</p>
					</article>

					<figure className="m-0">
						<div
							ref={imageRef}
							className="rounded-[16px] border border-[#CDDAD5] bg-white p-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)] will-change-transform motion-reduce:!transform-none"
						>
							<img
								src="/dashboard.webp"
								alt="GreenShift dashboard showing energy efficiency project data visualization"
								loading="lazy"
								decoding="async"
								className="w-full rounded-[12px]"
							/>
						</div>
						<figcaption className="sr-only">
							Preview of the GreenShift project monitoring dashboard
						</figcaption>
					</figure>
				</div>
			</div>
		</section>
	);
}
