import { buttonVariants, cn } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

export default function CtaSection() {
	return (
		<section id="contact" className="bg-white">
			<div className="page-wrap py-24">
				<div className="rounded-[24px] bg-[#03442C] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
						<div>
							<p className="text-base font-bold uppercase tracking-[0.2em] text-[#D5ED9F]">
								Get Started Now
							</p>
							<h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-white">
								Ready to start your energy transition?
							</h2>
							<p className="mt-6 max-w-xl text-lg leading-relaxed text-white">
								Register for free and submit your first energy efficiency
								project today.
							</p>
						</div>

						<div className="flex flex-col items-start gap-4 lg:items-end">
							<Link
								to="/register"
								className={cn(
									buttonVariants({ variant: "default" }),
									"h-[42px] w-[180px] cursor-pointer rounded-[10px] bg-[#f7f7f9] text-base text-[#1a1a1a] normal-case tracking-normal hover:bg-white",
								)}
							>
								Get Started Free
							</Link>
							<p className="text-base text-white">
								Need help?{" "}
								{/* One unbreakable run: a wrap after the `@` would split the
								    anchor into two boxes and make the hit area look wrong. */}
								<a
									href="mailto:contact@greenshift.com"
									className="whitespace-nowrap font-semibold text-white underline underline-offset-2 hover:text-[#D5ED9F]"
								>
									contact@greenshift.com
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
