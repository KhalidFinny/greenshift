import { Button, ShimmerBlock } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** The shared shape of every vendor detail page: a back control, one brand band with the record's identity and headline figures, then a reading column with a sticky action rail. */

/** Destinations a detail page can return to. Typed so a typo cannot ship. */
type DetailBackTarget =
	| "/vendor/opportunities"
	| "/vendor/deals"
	| "/vendor/portfolio";

interface DetailStat {
	label: string;
	value: string;
	/** Positive figures take the brand green; everything else stays white. */
	tone?: "default" | "positive";
}

interface DetailHeroProps {
	/** Status chips that qualify the record. Shimmered while loading. */
	badges?: ReactNode;
	/** The record's name. Shimmered while loading. */
	title?: string;
	/** Client, location, and other identity facts shown inline after the title. */
	meta?: ReactNode;
	/** Labels are static per page, so they render even while values shimmer. */
	stats: DetailStat[];
	loading?: boolean;
}

export function DetailHero({
	badges,
	title,
	meta,
	stats,
	loading = false,
}: DetailHeroProps) {
	return (
		<div className="space-y-4 rounded-2xl bg-[#03442C] p-8 text-white">
			<div className="flex flex-wrap items-center gap-3">
				{loading ? (
					<>
						<ShimmerBlock className="h-7 w-32 rounded-md bg-white/15" />
						<ShimmerBlock className="h-7 w-56 rounded-lg bg-white/15" />
					</>
				) : (
					badges
				)}
			</div>

			<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
				{loading ? (
					<>
						<ShimmerBlock className="h-9 w-80 bg-white/15" />
						<ShimmerBlock className="h-5 w-40 bg-white/15" />
					</>
				) : (
					<>
						<h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
							{title}
						</h1>
						{meta}
					</>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{stats.map((stat) => (
					<div key={stat.label} className="rounded-xl bg-white/10 p-4">
						<p className="text-sm text-emerald-200">{stat.label}</p>
						{loading ? (
							<ShimmerBlock className="mt-1 h-6 w-32 bg-white/15" />
						) : (
							<p
								className={
									stat.tone === "positive"
										? "mt-1 text-lg font-bold text-emerald-300"
										: "mt-1 text-lg font-bold text-white"
								}
							>
								{stat.value}
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

interface DetailShellProps {
	backTo: DetailBackTarget;
	backLabel: string;
	hero: ReactNode;
	children: ReactNode;
	/** Sticky action rail. Omit for a record with nothing to act on. */
	aside?: ReactNode;
}

export function DetailShell({
	backTo,
	backLabel,
	hero,
	children,
	aside,
}: DetailShellProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link to={backTo}>
					<Button variant="outline" className="cursor-pointer font-medium">
						{backLabel}
					</Button>
				</Link>
			</div>

			{hero}

			{hero ? (
				aside ? (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="space-y-6 lg:col-span-2">{children}</div>
						<div className="sticky top-6 space-y-6 self-start">{aside}</div>
					</div>
				) : (
					<div className="space-y-6">{children}</div>
				)
			) : (
				children
			)}
		</div>
	);
}
