import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@greenshift/ui";

const faqs = [
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
			"Access a real-time dashboard to track project performance, investment returns, and carbon emission reduction impact. All data is available in one place.",
	},
	{
		question: "Who is involved in the GreenShift ecosystem?",
		answer:
			"Industrial companies, energy vendors, independent validators, OJK-licensed SCF partners, and investors all work within one measurable and transparent ecosystem.",
	},
];

export default function FaqSection() {
	return (
		<section id="faq" className="bg-white">
			<div className="page-wrap py-28">
				<header className="max-w-2xl">
					<p className="text-base font-bold uppercase tracking-[0.2em] text-[#03442C]">
						FAQ
					</p>
					<h2 className="mt-4 text-[40px] font-bold leading-tight text-[#1C1C1C]">
						Frequently asked questions
					</h2>
					<p className="mt-6 text-lg leading-relaxed text-[#555555]">
						Didn't find your answer? Email us at{" "}
						<a
							href="mailto:contact@greenshift.com"
							className="font-semibold text-[#00712D] underline underline-offset-2 hover:text-[#03442C]"
						>
							contact@greenshift.com
						</a>
						.
					</p>
				</header>

				<div className="mt-16 grid gap-x-16 lg:grid-cols-2">
					<Accordion
						type="single"
						collapsible
						className="border-t border-[#CDDAD5]"
					>
						{faqs.slice(0, 3).map((faq) => (
							<AccordionItem
								key={faq.question}
								value={faq.question}
								className="border-b border-[#CDDAD5]"
							>
								<AccordionTrigger className="py-6 text-xl font-semibold text-[#1C1C1C]">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-lg leading-relaxed text-[#555555]">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
					<Accordion
						type="single"
						collapsible
						className="border-t border-[#CDDAD5]"
					>
						{faqs.slice(3).map((faq) => (
							<AccordionItem
								key={faq.question}
								value={faq.question}
								className="border-b border-[#CDDAD5]"
							>
								<AccordionTrigger className="py-6 text-xl font-semibold text-[#1C1C1C]">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-lg leading-relaxed text-[#555555]">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
