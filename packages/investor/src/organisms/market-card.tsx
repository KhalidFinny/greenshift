import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
	faBuilding,
	faCar,
	faFlask,
	faGears,
	faIndustry,
	faLandmark,
	faLeaf,
	faLocationDot,
	faScroll,
	faSeedling,
	faShirt,
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
import { formatTonnes, monthLabel, titleCase } from "../lib/format";
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

/** Sector icons keyed by the submitted sector vocabulary: the sector decides the
 * icon, so a boiler retrofit in a textile plant still reads as textile. */
const SECTOR_ICONS: Record<string, IconDefinition> = {
	cement: faIndustry,
	"iron and steel": faIndustry,
	aluminium: faIndustry,
	fertiliser: faFlask,
	textile: faShirt,
	"food and beverage": faUtensils,
	chemical: faFlask,
	"pulp and paper": faScroll,
	machinery: faGears,
	automotive: faCar,
	"commercial buildings": faBuilding,
	"public sector": faLandmark,
	agriculture: faSeedling,
};

function categoryIconFor(listing: BondListing): IconDefinition {
	const sector = (listing.industrySector ?? "").trim().toLowerCase();
	return SECTOR_ICONS[sector] ?? faLeaf;
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
	const monitoring = listing.monitoring;
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
							label="Verified cut"
							value={formatTonnes(monitoring.verifiedTco2)}
							tone="text-primary"
						/>
						<Metric
							label="Annual target"
							value={formatTonnes(listing.targetEmissionReduction)}
						/>
						<Metric label="Risk" value={risk.label} />
					</div>
					<div className="flex items-center justify-between gap-4 border-t border-border/70 p-3">
						<p className="text-sm text-muted-foreground">
							MRV periods reported
						</p>
						<p className="text-lg font-semibold tabular-nums">
							{monitoring.periods}
						</p>
					</div>
				</div>

				{/* What GreenShift can report itself: the measured reductions its
				    MRV periods account for, against the baseline they held to. */}
				<div className="rounded-lg border border-border/70 p-3">
					{monitoring.periods === 0 ? (
						<p className="text-sm leading-relaxed text-muted-foreground">
							Monitoring starts with the project's first MRV period. None has
							been reported yet, so there is nothing measured to show.
						</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm text-muted-foreground">
									Latest MRV period
								</p>
								<p className="text-sm font-semibold tabular-nums">
									{monthLabel(monitoring.latestPeriod ?? "")}
								</p>
							</div>
							<p
								className={cn(
									"mt-2 text-sm leading-relaxed",
									monitoring.anomalyFlagged
										? "text-destructive"
										: "text-emerald-700",
								)}
							>
								{monitoring.anomalyFlagged
									? "A reported period deviated from its baseline and is flagged for technical review."
									: "Every reported period has held its baseline."}
							</p>
						</>
					)}
				</div>
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-3">
				{verified ? (
					<>
						<p className="text-sm text-muted-foreground">
							Issued through a licensed securities partner. Buy it in their app:
						</p>
						<BondPurchaseActions project={listing} />
					</>
				) : (
					<div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-3">
						<p className="text-sm font-medium">Not yet trading</p>
						<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
							The blueprint is still with the validator and the securities
							partner, so no instrument has been issued. Monitoring begins with
							the first reported period.
						</p>
					</div>
				)}
			</CardFooter>
		</Card>
	);
}

/** Loading frame for `BondCard`: the same card, header, metric grid and footer with
 * shimmering leaves, kept beside the card so the two cannot drift apart. */
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

				<div className="rounded-lg border border-border/70 p-3">
					<div className="flex items-center justify-between gap-4">
						<ShimmerBlock className="h-4 w-32" />
						<ShimmerBlock className="h-4 w-16" />
					</div>
					<ShimmerBlock className="mt-2 h-4 w-56" />
				</div>
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-3">
				<ShimmerBlock className="h-4 w-48" />
				<ShimmerBlock className="h-11 w-full" />
			</CardFooter>
		</Card>
	);
}
