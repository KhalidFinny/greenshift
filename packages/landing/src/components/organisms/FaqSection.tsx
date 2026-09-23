import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@greenshift/ui";
import { landingFaqs as faqs } from "../../content/landing";

export default function FaqSection() {
	return (
		<section id="faq" className="bg-white">
			<div className="page-wrap py-28">
				<header className="mx-auto max-w-2xl text-center">
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

				<div className="mx-auto mt-16 grid max-w-5xl gap-x-16 gap-y-10 lg:grid-cols-2">
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
