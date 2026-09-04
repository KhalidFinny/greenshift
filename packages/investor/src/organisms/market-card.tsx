import type { MarketProject } from "@greenshift/api/contracts";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
	faArrowRight,
	faBolt,
	faBookmark,
	faIndustry,
	faLeaf,
	faLocationDot,
	faTruck,
	faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { formatIdr, formatTonnes, titleCase } from "../lib/format";
import { riskMeta, STATUS_BADGE_CLASS } from "../lib/labels";

interface MarketCardProps {
	project: MarketProject;
	onBuy: () => void;
	disabled?: boolean;
}

function categoryIconFor(project: MarketProject): IconDefinition {
	const scope = `${project.title} ${project.industrySector ?? ""}`.toLowerCase();
	if (
		scope.includes("solar") ||
		scope.includes("plts") ||
		scope.includes("panel") ||
		scope.includes("energi")
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

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
	return (
		<div className="p-3">
			<p className="text-base text-muted-foreground">{label}</p>
			<p className={`mt-2 text-lg font-semibold tabular-nums whitespace-nowrap [overflow-wrap:normal] ${tone ?? "text-foreground"}`}>
				{value}
			</p>
		</div>
	);
}

export function MarketCard({ project, onBuy, disabled = false }: MarketCardProps) {
	const categoryIcon = categoryIconFor(project);
	const risk = riskMeta(project.riskScore);
	const remaining = Math.max((project.budget ?? 0) - project.funded, 0);
	const progress = Math.round(project.fundingProgress * 100);
	const irr = project.blueprint.irr;
	const payback = project.blueprint.paybackPeriod;
	const riskTone =
		risk.tone === "destructive"
			? "text-destructive"
			: risk.tone === "secondary"
				? "text-amber-600"
				: "text-primary";

	return (
		<Card className="flex flex-col">
			<CardHeader className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
							<FontAwesomeIcon icon={categoryIcon} className="size-5" />
						</div>
						<Badge variant="secondary" className={STATUS_BADGE_CLASS}>
							{titleCase(project.industrySector ?? "Umum")}
						</Badge>
					</div>
					<FontAwesomeIcon icon={faBookmark} className="size-5 text-muted-foreground" />
				</div>

				<div className="space-y-2">
					<CardTitle className="text-2xl leading-snug">{project.title}</CardTitle>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground">
						{project.companyName ? <span>{project.companyName}</span> : null}
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faLocationDot} className="size-4" />
							{project.location ?? "Lokasi belum ditentukan"}
						</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				<div>
					<div className="flex items-center justify-between gap-4">
						<p className="text-base text-muted-foreground">Progres pendanaan</p>
						<p className="text-lg font-semibold tabular-nums">{progress}%</p>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
						<div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
					</div>
					<p className="mt-3 text-base tabular-nums text-muted-foreground">
						{formatIdr(project.funded)} terkumpul / {formatIdr(project.budget)}
					</p>
				</div>

				<div className="overflow-hidden rounded-lg border border-border/70">
					<div className="grid grid-cols-3 divide-x divide-border/70 border-b border-border/70">
						<Metric
							label="Return"
							value={typeof irr === "number" ? `${irr.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% p.a.` : "—"}
							tone="text-primary"
						/>
						<Metric label="Tenor" value={typeof payback === "number" ? `${payback} thn` : "—"} />
						<Metric label="Risiko" value={risk.label} tone={riskTone} />
					</div>
					<div className="flex items-center justify-between gap-4 border-b border-border/70 p-3">
						<p className="text-base text-muted-foreground">Pengurangan Emisi</p>
						<p className="text-right text-lg font-semibold tabular-nums whitespace-nowrap [overflow-wrap:normal]">
							{formatTonnes(project.targetEmissionReduction)}
						</p>
					</div>
					<div className="grid grid-cols-2 divide-x divide-border/70">
						<Metric label="Pendanaan" value={formatIdr(project.budget)} />
						<Metric label="Sisa dana" value={formatIdr(remaining)} />
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<Button size="lg" variant="outline" className="w-full text-base" disabled={disabled || remaining <= 0} onClick={onBuy}>
					{disabled ? "Data Contoh" : "Lihat Detail"}
					<FontAwesomeIcon icon={faArrowRight} />
				</Button>
			</CardFooter>
		</Card>
	);
}
