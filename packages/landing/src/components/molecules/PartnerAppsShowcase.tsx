import { PARTNER_APPS } from "@greenshift/core";

/** The money is handled outside GreenShift; the logos are the ones the partners publish. */
export default function PartnerAppsShowcase() {
	return (
		<figure className="m-0">
			<div className="rounded-[16px] border border-[#CDDAD5] bg-white p-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
				<div className="rounded-[12px] bg-[#F8F9F7] px-6 py-8">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#03442C]">
						Our Securities Partners
					</p>
					<p className="mx-auto mt-3 max-w-md text-center text-base leading-relaxed text-[#555]">
						The bond is issued, sold and held by a licensed securities partner.
						GreenShift monitors what the project cuts; the partner keeps the
						instrument.
					</p>
					<ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
						{PARTNER_APPS.map((partner) => (
							<li key={partner.key}>
								<a
									href={partner.playUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-full items-center gap-4 rounded-[12px] border border-[#CDDAD5] bg-white px-4 py-4 no-underline transition-colors hover:border-[#00712D]"
								>
									<img
										src={partner.logoUrl}
										alt={`${partner.name} app icon`}
										width={56}
										height={56}
										loading="lazy"
										decoding="async"
										className="size-14 shrink-0 rounded-[14px] border border-[#CDDAD5]"
									/>
									<span className="min-w-0">
										<span className="block text-base font-bold text-[#1C1C1C]">
											{partner.name}
										</span>
										<span className="mt-1 block text-sm leading-snug text-[#555]">
											{partner.publisher}
										</span>
									</span>
								</a>
							</li>
						))}
					</ul>
				</div>
			</div>
			<figcaption className="sr-only">
				The securities partners that issue and hold the bonds GreenShift
				projects are financed through
			</figcaption>
		</figure>
	);
}
