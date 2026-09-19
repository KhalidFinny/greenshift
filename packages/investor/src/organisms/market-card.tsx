import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
	faBolt,
	faIndustry,
	faLeaf,
	faLocationDot,
	faTruck,
	faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BondListing } from "@greenshift/api/contracts";
import {
	Badge,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	cn,
	ShimmerBlock,
} from "@greenshift/ui";
import { formatIdr, formatTonnes, titleCase } from "../lib/format";
import { riskMeta } from "../lib/labels";
import { BondPurchaseActions } from "./bond-purchase-actions";

interface BondCardProps {
	listing: BondListing;
}

const STATUS_META: Record<
	BondListing["status"],
	{ label: string; className: string }
> = {
	verified: {
		label: "Verified",
		className: "border-transparent bg-primary/10 text-primary",
	},
	on_progress: {
		label: "In Progress",
		className: "border-transparent bg-amber-500/15 text-amber-700",
	},
};

function categoryIconFor(listing: BondListing): IconDefinition {
	const scope =
		`${listing.title} ${listing.industrySector ?? ""}`.toLowerCase();
	if (
		scope.includes("solar") ||
		scope.includes("plts") ||
		scope.includes("panel") ||
		scope.includes("energy") ||
		scope.includes("electric") ||
		scope.includes("power")
	) {
		return faBolt;
	}
	if (scope.includes("logistics") || scope.includes("warehouse")) {
		return faTruck;
	}
	if (
		scope.includes("food") ||
		scope.includes("beverage") ||
		scope.includes("f&b") ||
		scope.includes("boiler") ||
		scope.includes("biomass")
	) {
		return faUtensils;
	}
	if (
		scope.includes("manufacturing") ||
		scope.includes("metal") ||
		scope.includes("textile") ||
		scope.includes("chemical") ||
		scope.includes("paper")
	) {
		return faIndustry;
	}
	return faLeaf;
}

function Metric({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone?: string;
}) {
	return (
		<div className="p-3">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p
				className={cn(
					"mt-1 text-lg font-semibold tabular-nums whitespace-nowrap [overflow-wrap:normal]",
					tone ?? "text-foreground",
				)}
			>
				{value}
			</p>
		</div>
	);
}

export function BondCard({ listing }: BondCardProps) {
	const status = STATUS_META[listing.status];
	const categoryIcon = categoryIconFor(listing);
	const risk = riskMeta(listing.riskScore);
	const progress = Math.round(listing.fundingProgress * 100);
	const irr = listing.blueprint.irr;
	const payback = listing.blueprint.paybackPeriod;
	const verified = listing.status === "verified";

	return (
		<Card className="flex flex-col">
			<CardHeader className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
							<FontAwesomeIcon icon={categoryIcon} className="size-5" />
						</div>
						<Badge variant="secondary" className={status.className}>
							{status.label}
						</Badge>
					</div>
					<Badge variant="outline">
						{titleCase(listing.industrySector ?? "General")}
					</Badge>
				</div>

				<div className="space-y-2">
					<CardTitle className="text-2xl leading-snug">
						{listing.title}
					</CardTitle>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
						{listing.companyName ? <span>{listing.companyName}</span> : null}
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faLocationDot} className="size-4" />
							{listing.location ?? "Location not specified"}
						</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				<div className="overflow-hidden rounded-lg border border-border/70">
					<div className="grid grid-cols-3 divide-x divide-border/70">
						<Metric
							label="Coupon"
							value={
								typeof irr === "number"
									? `${irr.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`
									: "-"
							}
							tone="text-primary"
						/>
						<Metric
							label="Tenor"
							value={typeof payback === "number" ? `${payback} yrs` : "-"}
						/>
						<Metric label="Risk" value={risk.label} />
					</div>
					<div className="flex items-center justify-between gap-4 border-t border-border/70 p-3">
						<p className="text-sm text-muted-foreground">Issuance amount</p>
						<p className="text-lg font-semibold tabular-nums">
							{formatIdr(listing.budget)}
						</p>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">Funding progress</p>
						<p className="text-sm font-semibold tabular-nums">{progress}%</p>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<p className="mt-2 text-sm tabular-nums text-muted-foreground">
						{formatIdr(listing.funded)} raised ·{" "}
						{formatTonnes(listing.targetEmissionReduction)} emission reduction
					</p>
				</div>
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-3">
				{verified ? (
					<>
						<p className="text-sm text-muted-foreground">
							Active listing. Buy through a broker:
						</p>
						<BondPurchaseActions project={listing} />
					</>
				) : (
					<div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-3">
						<p className="text-sm font-medium">Not yet trading</p>
						<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
							The bond is still undergoing verification and broker placement.
							Contact us for information on the offering period.
						</p>
					</div>
				)}
			</CardFooter>
		</Card>
	);
}

/**
 * Loading frame for `BondCard`: the same card, header, metric grid, progress
 * band, and footer, with shimmering leaves. It lives beside the card it stands
 * in for so the two cannot drift apart.
 */
export function BondCardSkeleton() {
	return (
		<Card className="flex flex-col">
			<CardHeader className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<ShimmerBlock className="size-11 rounded-full" />
						<ShimmerBlock className="h-6 w-20 rounded-full" />
					</div>
					<ShimmerBlock className="h-6 w-24 rounded-full" />
				</div>
				<div className="space-y-2">
					<ShimmerBlock className="h-7 w-3/4" />
					<ShimmerBlock className="h-5 w-40" />
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				<div className="overflow-hidden rounded-lg border border-border/70">
					<div className="grid grid-cols-3 divide-x divide-border/70">
						{Array.from({ length: 3 }, (_, index) => (
							<div key={index} className="space-y-2 p-3">
								<ShimmerBlock className="h-4 w-16" />
								<ShimmerBlock className="h-6 w-full" />
							</div>
						))}
					</div>
					<div className="flex items-center justify-between gap-4 border-t border-border/70 p-3">
						<ShimmerBlock className="h-4 w-28" />
						<ShimmerBlock className="h-6 w-24" />
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-4">
						<ShimmerBlock className="h-4 w-32" />
						<ShimmerBlock className="h-4 w-10" />
					</div>
					<ShimmerBlock className="h-2 w-full rounded-full" />
					<ShimmerBlock className="h-4 w-56" />
				</div>
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-3">
				<ShimmerBlock className="h-4 w-48" />
				<ShimmerBlock className="h-11 w-full" />
			</CardFooter>
		</Card>
	);
}
