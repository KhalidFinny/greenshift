/** What a step shows beside its copy: a product screen, or the partner apps it happens with. */
export type StepVisual =
	| {
			kind: "image";
			src: string;
			width: number;
			height: number;
			alt: string;
	  }
	| { kind: "partners" };

export interface LandingStep {
	id: string;
	stepLabel: string;
	title: string;
	description: string;
	visual: StepVisual;
}

export const howItWorksSteps: LandingStep[] = [
	{
		id: "01",
		stepLabel: "Validate",
		title: "Start with Ease",
		description:
			"Simply fill in your company profile and upload supporting documents such as electricity bills, energy audits, and other operational data. Our system validates every piece of information automatically so the process stays fast, transparent, and hassle-free.",
		// The size is declared so the frame keeps its height while a swapped image is still loading.
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

export interface LandingFaq {
	question: string;
	answer: string;
}

export const landingFaqs: LandingFaq[] = [
	{
		question: "Does GreenShift offer a free account?",
		answer:
			"Yes. Register for free to explore the platform: company profile, basic project assessment, blueprints, ROI simulation, and vendor search with a demo dataset.",
	},
	{
		question: "How do I get started?",
		answer:
			"Register for a free account, complete your company profile, and submit your first energy efficiency project. The GreenShift team validates every submission before the project moves to the next stage.",
	},
	{
		question: "Do I need technical data to get started?",
		answer:
			"Not at all. Just fill in your company profile and upload supporting documents such as electricity bills or energy audits. The system validates every piece of information automatically so the process stays fast and transparent.",
	},
	{
		question: "How does my project get funded?",
		answer:
			"Once the project is validated and its blueprint is prepared, it is ready to attract our investment partners. GreenShift bridges your financing needs with investors committed to the energy transition.",
	},
	{
		question: "How do I monitor a project after it is funded?",
		answer:
			"GreenShift reports what the project actually cuts: measured energy saving and carbon reduction, period by period, checked against the baseline it was verified on. The bond itself is issued and held by a licensed securities partner, so the investment is followed in their app.",
	},
	{
		question: "Who is involved in the GreenShift ecosystem?",
		answer:
			"Industrial companies, energy vendors, independent validators, OJK-licensed SCF partners, and investors all work within one measurable and transparent ecosystem.",
	},
];

export const landingFacts: Array<{ title: string; body: string }> = [
	{
		title: "The target is the one that was verified",
		body: "Every project carries the emission target its blueprint promised, so the reduction it reports is read against the number it was cleared on.",
	},
	{
		title: "Every period is measured and compared",
		body: "Energy saving and carbon reduction are reported period by period against the verified baseline, and a period that deviates is flagged on the record.",
	},
	{
		title: "The money is handled by a licensed partner",
		body: "GreenShift measures and verifies. The bond is issued, sold and held by a licensed securities partner, whose app is where the investment is followed.",
	},
];
