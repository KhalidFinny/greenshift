import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	buttonVariants,
	cn,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { landingFaqs } from "../content/landing";

export default function MobileFaq() {
	return (
		<>
			<section id="faq" className="bg-white px-5 py-14">
				<h2 className="text-[24px] font-bold leading-tight text-[#1C1C1C]">
					Frequently asked questions
				</h2>
				<p className="mt-3 text-base leading-relaxed text-[#555]">
					Didn't find your answer? Email{" "}
					<a
						href="mailto:contact@greenshift.com"
						className="font-semibold text-[#00712D] underline underline-offset-2"
					>
						contact@greenshift.com
					</a>
					.
				</p>

				<Accordion
					type="single"
					collapsible
					className="mt-6 border-t border-[#CDDAD5]"
				>
					{landingFaqs.map((faq) => (
						<AccordionItem
							key={faq.question}
							value={faq.question}
							className="border-b border-[#CDDAD5]"
						>
							<AccordionTrigger className="py-5 text-left text-base font-semibold text-[#1C1C1C]">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="pb-5 text-base leading-relaxed text-[#555]">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<section className="bg-[#F8F9F7] px-5 py-14">
				<h2 className="text-[24px] font-bold leading-tight text-[#1C1C1C]">
					Submit your first project
				</h2>
				<p className="mt-3 text-base leading-relaxed text-[#555]">
					Register as a company or as a vendor. A company verifies its legal
					documents before the platform opens; a vendor files its certification
					and is verified by an administrator.
				</p>
				<div className="mt-6 flex flex-col gap-3">
					<Link
						to="/register"
						className={cn(
							buttonVariants({ size: "lg" }),
							"h-12 w-full justify-center bg-[#00712D] text-base font-semibold text-white hover:bg-[#00712D]/90",
						)}
					>
						Create an account
					</Link>
					<Link
						to="/login"
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"h-12 w-full justify-center text-base font-semibold",
						)}
					>
						Sign in
					</Link>
				</div>
			</section>
		</>
	);
}
