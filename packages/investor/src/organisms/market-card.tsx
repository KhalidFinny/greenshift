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
import type { ObligasiListing } from "@greenshift/api/contracts";
import {
	Badge,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	cn,
} from "@greenshift/ui";
import { formatIdr, formatTonnes, titleCase } from "../lib/format";
import { riskMeta } from "../lib/labels";
import { BondPurchaseActions } from "./bond-purchase-actions";

interface ObligasiCardProps {
	listing: ObligasiListing;
}

const STATUS_META: Record<
	ObligasiListing["status"],
	{ label: string; className: string }
> = {
	verified: {
		label: "Terverifikasi",
		className: "border-transparent bg-primary/10 text-primary",
	},
	on_progress: {
		label: "Dalam Proses",
		className: "border-transparent bg-amber-500/15 text-amber-700",
	},
};

function categoryIconFor(listing: ObligasiListing): IconDefinition {
	const scope =
		`${listing.title} ${listing.industrySector ?? ""}`.toLowerCase();
	if (
		scope.includes("solar") ||
		scope.includes("plts") ||
		scope.includes("panel") ||
		scope.includes("energi") ||
		scope.includes("listrik")
	) {
		return faBolt;
	}
	if (scope.includes("logistik") || scope.includes("pergudangan")) {
		return faTruck;
	}
	if (
		scope.includes("makanan") ||
		scope.includes("minuman") ||
		scope.includes("f&b") ||
		scope.includes("food") ||
		scope.includes("boiler") ||
		scope.includes("biomassa")
	) {
		return faUtensils;
	}
	if (
		scope.includes("manufaktur") ||
		scope.includes("logam") ||
		scope.includes("tekstil") ||
		scope.includes("kimia")
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

export function ObligasiCard({ listing }: ObligasiCardProps) {
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
						{titleCase(listing.industrySector ?? "Umum")}
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
							{listing.location ?? "Lokasi belum ditentukan"}
						</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				<div className="overflow-hidden rounded-lg border border-border/70">
					<div className="grid grid-cols-3 divide-x divide-border/70">
						<Metric
							label="Kupon"
							value={
								typeof irr === "number"
									? `${irr.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
									: "-"
							}
							tone="text-primary"
						/>
						<Metric
							label="Tenor"
							value={typeof payback === "number" ? `${payback} thn` : "-"}
						/>
						<Metric label="Risiko" value={risk.label} />
					</div>
					<div className="flex items-center justify-between gap-4 border-t border-border/70 p-3">
						<p className="text-sm text-muted-foreground">Nominal penerbitan</p>
						<p className="text-lg font-semibold tabular-nums">
							{formatIdr(listing.budget)}
						</p>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">Progres pendanaan</p>
						<p className="text-sm font-semibold tabular-nums">{progress}%</p>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<p className="mt-2 text-sm tabular-nums text-muted-foreground">
						{formatIdr(listing.funded)} terkumpul ·{" "}
						{formatTonnes(listing.targetEmissionReduction)} reduksi emisi
					</p>
				</div>
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-3">
				{verified ? (
					<>
						<p className="text-sm text-muted-foreground">
							Listing aktif. Beli melalui broker:
						</p>
						<BondPurchaseActions project={listing} />
					</>
				) : (
					<div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-3">
						<p className="text-sm font-medium">Belum diperdagangkan</p>
						<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
							Obligasi masih dalam proses verifikasi dan penempatan broker.
							Hubungi kami untuk informasi masa penawaran.
						</p>
					</div>
				)}
			</CardFooter>
		</Card>
	);
}
