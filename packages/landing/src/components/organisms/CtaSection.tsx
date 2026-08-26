import { buttonVariants, cn } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

export default function CtaSection() {
	return (
		<section id="hubungi-kami" className="bg-white">
			<div className="page-wrap py-24">
				<div className="rounded-[24px] bg-[#03442C] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
						<div>
							<p className="text-base font-bold uppercase tracking-[0.2em] text-[#D5ED9F]">
								Mulai Sekarang
							</p>
							<h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-white">
								Siap memulai transisi energi Anda?
							</h2>
							<p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
								Daftar gratis dan ajukan proyek efisiensi energi pertama Anda
								hari ini.
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
								Mulai Gratis
							</Link>
							<p className="text-base text-white/85">
								Butuh bantuan?{" "}
								<a
									href="mailto:contact@greenshift.com"
									className="font-semibold text-white underline underline-offset-2 hover:text-[#D5ED9F]"
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
