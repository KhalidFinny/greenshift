/* The Green Project Blueprint as its company reads it: the document verification
 * produces. The chart plots each case's `recoveryRp` series; the page does no arithmetic. */

import { faFileShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ProjectBlueprintView } from "@greenshift/core";
import {
	Bar,
	BarChart,
	BarXAxis,
	cn,
	Grid,
	LineChart,
	ShimmerBlock,
} from "@greenshift/ui";
import { formatId } from "../../lib/number-format";
import {
	formatCompactRupiah,
	formatPercent,
	formatRupiah,
	formatSubmittedAt,
	formatTonnes,
	formatYears,
} from "../../lib/project-display";

const STATUS_LABEL: Record<string, string> = {
	draft: "Draft",
	audit: "In audit",
	validated: "Validated by LVV GRK",
	published: "Validated and published",
	rejected: "Rejected by the auditor",
};

/** The stage's tone: live stages amber, cleared ones emerald. */
const STATUS_PILL: Record<string, string> = {
	draft: "bg-muted text-muted-foreground",
	audit: "bg-amber-50 text-amber-700",
	validated: "bg-emerald-50 text-emerald-700",
	published: "bg-emerald-50 text-emerald-700",
	rejected: "bg-red-50 text-red-700",
};

/** One figure of the document, label above value. */
function Figure({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-border px-4 py-3">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="mt-1 font-semibold tabular-nums">{value}</p>
		</div>
	);
}

function Row({
	label,
	value,
}: {
	label: string;
	value: string;
	short?: boolean;
}) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="text-sm tabular-nums">{value}</p>
		</div>
	);
}

/** The projection: what each case recovered by the end of each year, against the
 * capital spent at year zero. Where a line crosses zero is that case's payback. */
function ProjectionChart({ blueprint }: { blueprint: ProjectBlueprintView }) {
	const points = Math.max(
		...blueprint.scenarios.map((scenario) => scenario.recoveryRp.length),
	);
	const labels = Array.from({ length: points }, (_, index) =>
		index === 0 ? "Capital" : `Year ${index}`,
	);

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-semibold">Capital recovered, year by year</h3>
			<LineChart
				ariaLabel="Capital recovered by each case, year by year, against the capital spent"
				formatValue={formatCompactRupiah}
				height={320}
				labels={labels}
				reference={{ value: 0, label: "Capital repaid" }}
				series={blueprint.scenarios.map((scenario, index) => ({
					key: scenario.key,
					label: `${scenario.label} · ${scenario.savingPct}% of plan`,
					values: scenario.recoveryRp,
					color: `var(--chart-${index + 3})`,
				}))}
			/>
			<p className="text-sm text-muted-foreground">
				Rupiah in today's money, discounted at{" "}
				{blueprint.discountRatePct === null
					? "the platform rate"
					: `${formatId(blueprint.discountRatePct)}%`}{" "}
				over {blueprint.horizonYears ?? labels.length - 1} years. The year a
				line crosses the capital-repaid mark is the year that case repays the
				bond; a line that never reaches it is a case the saving does not carry.
			</p>
		</div>
	);
}

/** What the project promises to cut, against the baseline it was measured on. */
function EmissionChart({ blueprint }: { blueprint: ProjectBlueprintView }) {
	const targets = blueprint.emissionTargets;
	if (!targets) return null;

	const bars = [
		{ label: "Baseline", value: targets.baselineTco2 },
		{ label: "Target", value: targets.targetTco2 },
	];

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-semibold">
				Emission reduction, tonnes CO₂e per year
			</h3>
			<BarChart data={bars} xDataKey="label" aspectRatio="2 / 1">
				<Grid horizontal numTicksRows={3} stroke="var(--border)" />
				<Bar dataKey="value" fill="var(--chart-3)" />
				<BarXAxis />
			</BarChart>
			<p className="text-sm text-muted-foreground">
				Baseline {formatTonnes(targets.baselineTco2)} per year, cut by{" "}
				{targets.targetPct}% to {formatTonnes(targets.targetTco2)} per year,
				from {formatId(targets.energySavingKwh)} kWh of annual saving. The
				baseline is the project's own measured consumption times its emission
				factor.
			</p>
		</div>
	);
}

/** The three cases as the document's own table. */
function CasesTable({ blueprint }: { blueprint: ProjectBlueprintView }) {
	if (blueprint.scenarios.length === 0) return null;

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-semibold">
				The projections it is issued against
			</h3>
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-border text-muted-foreground">
							<th className="py-2 pr-4 font-medium">Case</th>
							<th className="py-2 pr-4 font-medium">Share of plan</th>
							<th className="py-2 pr-4 font-medium">Present value</th>
							<th className="py-2 pr-4 font-medium">Return</th>
							<th className="py-2 pr-4 font-medium">Payback</th>
							<th className="py-2 font-medium">First-year saving</th>
						</tr>
					</thead>
					<tbody>
						{blueprint.scenarios.map((scenario) => (
							<tr key={scenario.key} className="border-b border-border">
								<td className="py-2 pr-4 font-medium">{scenario.label}</td>
								<td className="py-2 pr-4 tabular-nums">
									{scenario.savingPct}%
								</td>
								<td
									className={cn(
										"py-2 pr-4 tabular-nums",
										scenario.npvRp < 0 && "text-destructive",
									)}
								>
									{formatRupiah(scenario.npvRp)}
								</td>
								<td className="py-2 pr-4 tabular-nums">
									{scenario.irrPct === null
										? "Not reached"
										: formatPercent(scenario.irrPct)}
								</td>
								<td className="py-2 pr-4 tabular-nums">
									{formatYears(scenario.paybackYears)}
								</td>
								<td className="py-2 tabular-nums">
									{formatRupiah(scenario.firstYearSavingRp)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-sm text-muted-foreground">
				The base case is what the document carries as the project's projected
				return and net present value. A case is a share of the planned saving
				under its own energy-price and degradation assumptions, not a promise.
			</p>
		</div>
	);
}

export function ProjectBlueprintSection({
	blueprint,
	loading,
}: {
	/** Null while the project has no blueprint: it is written at verification. */
	blueprint: ProjectBlueprintView | null;
	loading: boolean;
}) {
	const funding = blueprint?.fundingStructure ?? null;

	return (
		<section className="space-y-4">
			<div className="border-b border-border pb-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="flex items-center gap-2 text-lg font-semibold">
						<FontAwesomeIcon
							icon={faFileShield}
							className="size-4 text-primary"
							aria-hidden
						/>
						Green Project Blueprint
					</h2>
					{blueprint === null ? null : (
						<span
							className={cn(
								"rounded-md px-2.5 py-1 text-sm font-medium",
								STATUS_PILL[blueprint.status] ??
									"bg-muted text-muted-foreground",
							)}
						>
							{STATUS_LABEL[blueprint.status] ?? blueprint.status}
						</span>
					)}
				</div>
				<p className="mt-1 text-sm text-muted-foreground">
					{blueprint === null
						? "Written when an LVV body verifies the project: it carries the funding structure, the emission targets and the projections this summary proves."
						: `Generated from the figures above${blueprint.validatedAt ? ` and verified on ${formatSubmittedAt(blueprint.validatedAt)}` : ""}. A bidder reads it during procurement, once it is published.`}
				</p>
			</div>

			{loading ? (
				<div className="space-y-3" aria-busy>
					<div className="grid gap-3 sm:grid-cols-4">
						{Array.from({ length: 4 }, (_, index) => (
							<ShimmerBlock key={index} className="h-20 w-full rounded-lg" />
						))}
					</div>
					<ShimmerBlock className="h-52 w-full rounded-lg" />
				</div>
			) : blueprint === null ? (
				<p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
					This project has no blueprint yet. It is written at verification, from
					the figures the submission filed.
				</p>
			) : (
				<div className="space-y-6">
					<div className="grid gap-3 sm:grid-cols-4">
						<Figure
							label="Instrument"
							value={
								funding?.instrument === "green_bond"
									? "Green bond"
									: "Not stated"
							}
						/>
						<Figure
							label="Discounted at"
							value={
								blueprint.discountRatePct === null
									? "Not stated"
									: `${formatId(blueprint.discountRatePct)}%`
							}
						/>
						<Figure
							label="Horizon"
							value={
								blueprint.horizonYears === null
									? "Not stated"
									: `${blueprint.horizonYears} years`
							}
						/>
						<Figure
							label="Project return"
							value={
								blueprint.irr === null || blueprint.irr === undefined
									? "Not reached"
									: formatPercent(blueprint.irr)
							}
						/>
					</div>

					<ProjectionChart blueprint={blueprint} />

					<EmissionChart blueprint={blueprint} />

					{funding ? (
						<div className="space-y-1">
							<h3 className="text-sm font-semibold">Funding structure</h3>
							<Row label="Capital" value={formatRupiah(funding.capexRp)} />
							<Row label="Tenor" value={`${funding.tenorYears} years`} />
							<Row
								label="Annual saving"
								value={formatRupiah(funding.annualSavingRp)}
							/>
							{funding.annualRevenueRp === null ? null : (
								<Row
									label="Annual revenue at the site"
									value={formatRupiah(funding.annualRevenueRp)}
								/>
							)}
							<Row
								label="Collateral"
								value={funding.collateral ?? "Not stated"}
							/>
						</div>
					) : null}

					<CasesTable blueprint={blueprint} />

					<p className="text-sm text-muted-foreground">
						The document is the technical case the LVV body verified. The bond
						itself is issued and held by a licensed securities partner: this is
						the record the partner and the bidders read.
					</p>
				</div>
			)}
		</section>
	);
}
