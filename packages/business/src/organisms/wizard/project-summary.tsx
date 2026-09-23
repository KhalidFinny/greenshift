/* The project summary: the financial case, the files and the risk assessment, written
 * once and read by the review step and the record. `context` says which framing. */

import { faCircleCheck, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ForecastScenario, RoiForecast } from "@greenshift/core";
import {
	Bar,
	BarChart,
	BarXAxis,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Grid,
} from "@greenshift/ui";
import { useState } from "react";
import { formatId } from "../../lib/number-format";
import {
	formatPercent,
	formatRupiah,
	formatYears,
} from "../../lib/project-display";
import type { ProjectFunding } from "../../lib/project-funding";
import type { ProjectRiskResult } from "../../lib/project-risk";
import { useForecastReading } from "../../lib/use-forecast-reading";
import { useProjectReading } from "../../lib/use-project-reading";
import {
	type RiskInsightState,
	useRiskInsight,
} from "../../lib/use-risk-insight";
import {
	type RoiForecastState,
	useRoiForecast,
} from "../../lib/use-roi-forecast";
import {
	AreaRow,
	EleanorNote,
	RiskAssessmentBody,
	ToneChip,
} from "./risk-assessment";

/** The Step 2 figures, as the submission filed them and as the form holds them. */
export type { ProjectFunding };

/** What the project is, in the words the reading is written from. */
export interface SummaryProject {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	jaminan: string | null;
}

export interface SummaryDocumentRow {
	id: string;
	label: string;
	/** Absent when nothing was uploaded into the slot. */
	name?: string;
	/** Where the stored file is read from, when the surface can serve it. */
	downloadUrl?: string;
}

export interface ProjectSummaryProps {
	project: SummaryProject;
	funding: ProjectFunding;
	/** The project's own files: what a bidder reads with the tender. */
	vendorDocs: SummaryDocumentRow[];
	/** The Step 3 scope of work, which the tender is bid against. */
	scope: { requirements: string[]; deliverables: string[] };
	risk: ProjectRiskResult | null;
	context: "review" | "record";
}

/** The money figures as numbers, for the charts and the ratios. */
interface PlanFigures {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	revenue: number | null;
}

/** What the figures say when read against each other: arithmetic over the two steps, so
 * the summary states a relationship rather than repeating a number the user typed. */
interface PlanReadings {
	/** CAPEX over the tenor: what the loan asks for each year. */
	annualRepayment: number | null;
	/** The saving as a share of that repayment. */
	coveragePct: number | null;
	/** CAPEX over the annual saving: years to recover the capital. */
	paybackYears: number | null;
	/** The saving as a share of annual revenue. */
	savingOfRevenuePct: number | null;
}

function readPlan(figures: PlanFigures): PlanReadings {
	const { capex, tenor, saving, revenue } = figures;
	const annualRepayment =
		capex !== null && tenor !== null && tenor > 0 ? capex / tenor : null;
	return {
		annualRepayment,
		coveragePct:
			annualRepayment !== null && annualRepayment > 0 && saving !== null
				? (saving / annualRepayment) * 100
				: null,
		paybackYears:
			capex !== null && capex > 0 && saving !== null && saving > 0
				? capex / saving
				: null,
		savingOfRevenuePct:
			revenue !== null && revenue > 0 && saving !== null
				? (saving / revenue) * 100
				: null,
	};
}

/** The chart the summary leans on: the three annual figures against the capital, in rupiah. */
function ComparisonChart({ figures }: { figures: PlanFigures }) {
	const bars = [
		{ label: "CAPEX", value: figures.capex },
		{ label: "Revenue", value: figures.revenue },
		{ label: "Saving", value: figures.saving },
	].flatMap((row) =>
		row.value === null ? [] : [{ label: row.label, value: row.value }],
	);

	if (bars.length < 2) {
		return (
			<p className="text-sm text-muted-foreground">
				Enter the capital requirement and the annual figures in Step 2, and the
				three are compared here.
			</p>
		);
	}

	return (
		<BarChart data={bars} xDataKey="label" aspectRatio="2 / 1">
			<Grid horizontal numTicksRows={3} stroke="var(--border)" />
			<Bar dataKey="value" fill="var(--chart-3)" />
			<BarXAxis />
		</BarChart>
	);
}

/** The saving against the repayment it has to cover, the ratio the funding case turns on. */
function CoverageMeter({ readings }: { readings: PlanReadings }) {
	const { coveragePct, annualRepayment, paybackYears } = readings;
	if (coveragePct === null || annualRepayment === null) {
		return (
			<p className="text-sm text-muted-foreground">
				The repayment follows from the capital and the tenor, and the cover from
				the annual saving. Fill in Step 2 to see it.
			</p>
		);
	}

	const covered = Math.min(coveragePct, 100);
	const behind = Math.max(0, 100 - covered);

	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between gap-4">
				<p className="text-sm text-muted-foreground">
					Annual saving against the annual repayment
				</p>
				<p className="shrink-0 text-sm font-semibold tabular-nums">
					{formatPercent(coveragePct)}
				</p>
			</div>
			<div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted">
				<div
					className="rounded-full bg-primary"
					style={{ width: `${covered}%` }}
				/>
				{behind > 0 && (
					<div
						className="rounded-full bg-chart-3"
						style={{ width: `${behind}%` }}
					/>
				)}
			</div>
			<p className="text-sm text-muted-foreground">
				{coveragePct >= 100
					? `The saving covers the ${formatRupiah(annualRepayment)} repayment in full.`
					: `The saving leaves ${formatRupiah(annualRepayment - (annualRepayment * covered) / 100)} of the repayment to operations.`}
				{paybackYears !== null
					? ` The capital is recovered in ${formatYears(paybackYears)} at this saving.`
					: ""}
			</p>
		</div>
	);
}

/** The reading the review step opens with, in a panel that fills its column. */
function ReadingPanel({ state }: { state: RiskInsightState }) {
	return (
		<EleanorNote className="h-full" state={state} tips={[]} maxParagraphs={3} />
	);
}

function Figure({
	label,
	value,
	short,
}: {
	label: string;
	value: string;
	short?: boolean;
}) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<dt className="text-muted-foreground">{label}</dt>
			<dd
				className={cn("tabular-nums font-medium", short && "text-destructive")}
			>
				{value}
			</dd>
		</div>
	);
}

/** One case as a column of the report: its name, the share of the plan it assumes, what
 * that produces, and the assumptions behind it: the two never come apart. */
function ScenarioColumn({
	scenario,
	first,
}: {
	scenario: ForecastScenario;
	first: boolean;
}) {
	return (
		<div
			className={cn(
				"space-y-3",
				!first && "sm:border-l sm:border-border sm:pl-6",
			)}
		>
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<p className="text-sm font-semibold">{scenario.label}</p>
				<p className="text-sm tabular-nums text-muted-foreground">
					{scenario.savingPct}% of plan
				</p>
			</div>
			<dl className="space-y-2 text-sm">
				<Figure
					label="Present value"
					value={formatRupiah(scenario.npvRp)}
					short={scenario.npvRp < 0}
				/>
				<Figure
					label="Project return"
					value={
						scenario.irrPct === null
							? "Not reached"
							: `${formatId(scenario.irrPct, 1)}%`
					}
				/>
				<Figure label="Payback" value={formatYears(scenario.paybackYears)} />
				<Figure
					label="First-year saving"
					value={formatRupiah(scenario.firstYearSavingRp)}
				/>
			</dl>
			<p className="text-sm text-muted-foreground">
				Energy price +{scenario.inflationPct}%/yr, asset degradation −
				{scenario.degradationPct}%/yr.
			</p>
		</div>
	);
}

/** What each case gets back, in today's money, as a share of the capital: the hundred
 * per cent mark is the capital repaid, the line the funding case turns on. */
function RecoveryChart({ forecast }: { forecast: RoiForecast }) {
	const bars = forecast.scenarios.map((scenario) => ({
		label: scenario.label,
		value: Math.round(
			((scenario.npvRp + forecast.capexRp) / forecast.capexRp) * 100,
		),
	}));

	return (
		<BarChart data={bars} xDataKey="label" aspectRatio="2 / 1">
			<Grid horizontal numTicksRows={3} stroke="var(--border)" />
			<Bar dataKey="value" fill="var(--chart-3)" />
			<BarXAxis />
		</BarChart>
	);
}

/** How long each case takes to hand the capital back, against the tenor. */
function PaybackChart({ forecast }: { forecast: RoiForecast }) {
	const bars = forecast.scenarios.flatMap((scenario) =>
		scenario.paybackYears === null
			? []
			: [{ label: scenario.label, value: scenario.paybackYears }],
	);

	if (bars.length < 2) {
		return (
			<p className="text-sm text-muted-foreground">
				A case whose saving never repays the capital has no payback to show.
			</p>
		);
	}

	return (
		<BarChart data={bars} xDataKey="label" aspectRatio="2 / 1">
			<Grid horizontal numTicksRows={3} stroke="var(--border)" />
			<Bar dataKey="value" fill="var(--chart-3)" />
			<BarXAxis />
		</BarChart>
	);
}

/** The ROI forecast, from the Step 2 figures by the same engine that generates the
 * blueprint. Eleanor reads the cases first and the numbers follow her. */
function RoiForecastPanel({
	state,
	reading,
}: {
	state: RoiForecastState;
	reading: RiskInsightState;
}) {
	const forecast = state.forecast;

	if (state.loading) {
		return (
			<p className="text-sm text-muted-foreground">
				Running the three cases over the project figures…
			</p>
		);
	}

	if (forecast === null) {
		return (
			<p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
				{state.failed
					? "The cases could not be computed. Your figures are unchanged, so the record is intact; reopen this page to try again."
					: "Enter the capital requirement, the tenor and the annual saving in Step 2, and the three cases are computed here."}
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<p className="text-sm font-medium">
					ROI forecast over the {forecast.horizonYears}-year tenor
				</p>
				<p className="text-sm tabular-nums text-muted-foreground">
					Discounted at {formatId(forecast.discountRatePct)}%
				</p>
			</div>

			<EleanorNote state={reading} tips={[]} maxParagraphs={3} />

			<div className="grid gap-6 sm:grid-cols-2">
				<div className="space-y-2">
					<p className="text-sm font-medium">
						Present value of the savings against the capital
					</p>
					<RecoveryChart forecast={forecast} />
					<p className="text-sm text-muted-foreground">
						What the {formatRupiah(forecast.capexRp)} of capital is worth once
						the savings are discounted back. The capital is repaid in full at
						100%.
					</p>
				</div>
				<div className="space-y-2">
					<p className="text-sm font-medium">Years to recover the capital</p>
					<PaybackChart forecast={forecast} />
					<p className="text-sm text-muted-foreground">
						At the first-year saving, against the {forecast.horizonYears}-year
						tenor the funding is taken over.
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<p className="text-sm font-medium">The three cases</p>
				<div className="grid gap-6 sm:grid-cols-3">
					{forecast.scenarios.map((scenario, index) => (
						<ScenarioColumn
							key={scenario.key}
							scenario={scenario}
							first={index === 0}
						/>
					))}
				</div>
			</div>

			<p className="text-sm text-muted-foreground">
				The base case is what the Green Project Blueprint carries as the
				project's projected IRR and net present value. The conservative and
				optimistic cases bound it: they are the same saving under a weaker and a
				stronger assumption, not a promise.
			</p>
		</div>
	);
}

/** How A reads the project and its figures back: the reading on one side, the charts behind it. */
function SummarySection({
	funding,
	readings,
	figures,
	reading,
}: {
	funding: ProjectFunding;
	readings: PlanReadings;
	figures: PlanFigures;
	reading: RiskInsightState;
}) {
	return (
		<div className="grid gap-8 sm:grid-cols-2 sm:items-stretch">
			<ReadingPanel state={reading} />
			<div className="space-y-5 sm:border-l sm:border-border sm:pl-8">
				<div className="space-y-2">
					<p className="text-sm font-medium">
						Capital against the annual figures
					</p>
					<ComparisonChart figures={figures} />
					<p className="text-sm text-muted-foreground">
						Rupiah, as entered in Step 2
						{funding.tenorTahun
							? `, over a ${formatId(funding.tenorTahun)}-year tenor`
							: ""}
						.
					</p>
				</div>
				<CoverageMeter readings={readings} />
			</div>
		</div>
	);
}

/** The tick appears only when a file is really there, and the state is spelled out beside it. */
function DocumentState({ name }: { name?: string }) {
	if (!name) {
		return (
			<span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
				<span
					aria-hidden
					className="size-4 rounded-full border border-border"
				/>
				Not uploaded
			</span>
		);
	}
	return (
		<span className="flex shrink-0 items-center gap-1.5 text-sm text-emerald-700">
			<FontAwesomeIcon icon={faCircleCheck} className="size-4" aria-hidden />
			Uploaded
		</span>
	);
}

/** A checklist as a progress line and the rows behind it. */
export function DocumentGroup({
	title,
	/** What a missing row tells the reader to do about it. */
	missing,
	rows,
}: {
	title: string;
	missing?: string;
	rows: SummaryDocumentRow[];
}) {
	const done = rows.filter((row) => row.name).length;
	const pct = rows.length > 0 ? (done / rows.length) * 100 : 0;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<p className="text-sm font-medium">{title}</p>
				<p className="text-sm tabular-nums text-muted-foreground">
					{done} of {rows.length} uploaded
				</p>
			</div>
			<div
				role="progressbar"
				aria-valuenow={done}
				aria-valuemin={0}
				aria-valuemax={rows.length}
				aria-label={`${title} completeness`}
				className="h-1.5 rounded-full bg-muted"
			>
				<div
					className="h-1.5 rounded-full bg-primary"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<ul className="grid gap-3 sm:grid-cols-2">
				{rows.map((row) => (
					<li
						key={row.id}
						className="rounded-lg border border-border px-4 py-3"
					>
						<div className="flex items-start justify-between gap-3">
							<p className="min-w-0 text-sm font-medium">{row.label}</p>
							<DocumentState name={row.name} />
						</div>
						{row.name ? (
							<div className="mt-1 flex items-center justify-between gap-3">
								<p
									className="truncate text-sm text-muted-foreground"
									title={row.name}
								>
									{row.name}
								</p>
								{row.downloadUrl ? (
									<a
										href={row.downloadUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="shrink-0 text-sm font-medium text-primary underline underline-offset-2"
										aria-label={`Download ${row.label}`}
									>
										Download
									</a>
								) : null}
							</div>
						) : missing ? (
							<p className="mt-1 text-sm text-muted-foreground">{missing}</p>
						) : null}
					</li>
				))}
			</ul>
		</div>
	);
}

/** B2: the risk number on one side, Eleanor's reading on the other, the assessment a click away. */
function RiskPair({
	risk,
	insight,
	onOpen,
}: {
	risk: ProjectRiskResult;
	insight: RiskInsightState;
	onOpen: () => void;
}) {
	const ranked = [...risk.breakdown].sort((a, b) => b.pct - a.pct);

	return (
		/* Half and half: the number and its areas on one side, her reading on the other. */
		<div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
			<div className="space-y-4 lg:pr-8">
				<p className="flex items-baseline gap-1.5">
					<span className="text-5xl font-semibold leading-none tabular-nums">
						{risk.score}
					</span>
					<span className="text-base text-muted-foreground">/100</span>
				</p>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					<ToneChip tone={risk.level} />
					<p className="text-sm tabular-nums text-muted-foreground">
						{risk.success}% probability of success
					</p>
				</div>
				<div className="space-y-3 border-t border-border pt-4">
					{ranked.map((row) => (
						<AreaRow key={row.key} row={row} />
					))}
				</div>
			</div>
			<div className="space-y-4 lg:border-l lg:border-border lg:pl-8">
				<EleanorNote state={insight} tips={risk.mitigations} />
				<Button type="button" variant="outline" onClick={onOpen}>
					<FontAwesomeIcon icon={faEye} aria-hidden />
					View the Risk Assessment Detail
				</Button>
			</div>
		</div>
	);
}

/** One area's heading, with the sentence that says where the figures came from. */
function AreaHeading({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="border-b border-border pb-3">
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
		</div>
	);
}

/** The two Step 3 lists, in the words a bidder reads them under: each its own labelled
 * group, so a reader can tell requirements from deliverables. */
function ScopeLists({ scope }: { scope: ProjectSummaryProps["scope"] }) {
	const groups = [
		{
			key: "requirements",
			title: "Key technical requirements",
			entries: scope.requirements,
		},
		{
			key: "deliverables",
			title: "Expected deliverables",
			entries: scope.deliverables,
		},
	];

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			{groups.map((group) => (
				<div key={group.key} className="space-y-2">
					<h3 className="text-sm font-semibold">{group.title}</h3>
					{group.entries.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nothing filed under this heading.
						</p>
					) : (
						<ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
							{group.entries.map((entry, index) => (
								<li
									key={`${group.key}-${index}`}
									className="border-b border-border/60 pb-1.5 last:border-0"
								>
									{entry}
								</li>
							))}
						</ul>
					)}
				</div>
			))}
		</div>
	);
}

export function ProjectSummary({
	project,
	funding,
	vendorDocs,
	scope,
	risk,
	context,
}: ProjectSummaryProps) {
	const review = context === "review";
	const [isRiskOpen, setIsRiskOpen] = useState(false);

	/* Two readings of the same assessment: the panel holds two sentences, the detail the note. */
	const brief = useRiskInsight(risk, "brief");
	const full = useRiskInsight(risk, "full");
	const reading = useProjectReading({ ...project, ...funding });
	const figures: PlanFigures = {
		capex: funding.capexRp,
		tenor: funding.tenorTahun,
		saving: funding.penghematanRp,
		revenue: funding.pendapatanRp,
	};
	const readings = readPlan(figures);
	const roiForecast = useRoiForecast(funding);
	const forecastReading = useForecastReading(funding);

	const uploaded = vendorDocs.filter((row) => row.name).length;
	const total = vendorDocs.length;

	return (
		<div className="space-y-10">
			<section className="space-y-4">
				<AreaHeading
					title={
						review
							? "A. Project & Financial Summary"
							: "Project & Financial Summary"
					}
					subtitle={
						review
							? "Read-only, taken from Steps 1 and 2."
							: "The figures the submission was filed with. The cases below are the ones the Green Project Blueprint carries."
					}
				/>
				<SummarySection
					figures={figures}
					funding={funding}
					readings={readings}
					reading={reading}
				/>
				<RoiForecastPanel state={roiForecast} reading={forecastReading} />
			</section>

			<section className="space-y-4">
				<AreaHeading
					title={review ? "B. Document Status" : "Project files for the vendor"}
					subtitle={
						review
							? `${uploaded} of ${total} documents uploaded. A tick means the file is saved with your draft.`
							: `${uploaded} of ${total} files on file. These are the files a bidder reads with the tender, so they price the work from them.`
					}
				/>
				<DocumentGroup
					missing={review ? "Upload it in Step 1." : undefined}
					rows={vendorDocs}
					title={review ? "Step 1 energy documents" : "Project documents"}
				/>
			</section>

			<section className="space-y-4">
				<AreaHeading
					title={review ? "C. Scope of Work" : "Scope of work"}
					subtitle={
						review
							? "Read-only, taken from Step 3. Both lists reach the bidders, and the requirements are read by the matching model."
							: "What the tender is bid against: the requirements a vendor has to meet, and what the delivery hands over."
					}
				/>
				<ScopeLists scope={scope} />
			</section>

			<section className="space-y-4">
				<AreaHeading
					title={
						review ? "D. Project Risk Assessment" : "Project Risk Assessment"
					}
					subtitle={
						review
							? "Scored from Steps 1–3, not a manual number."
							: "Scored from the submitted figures and documents, not a manual number."
					}
				/>
				{risk === null ? (
					<p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
						Not calculated yet. Complete Steps 1–3.
					</p>
				) : review ? (
					<>
						<RiskPair
							insight={brief}
							risk={risk}
							onOpen={() => setIsRiskOpen(true)}
						/>
						<Dialog open={isRiskOpen} onOpenChange={setIsRiskOpen}>
							<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle className="text-lg">
										Project Risk Assessment
									</DialogTitle>
									<DialogDescription className="text-sm">
										Scored from Steps 1–3, not a manual number.
									</DialogDescription>
								</DialogHeader>
								<RiskAssessmentBody insight={full} risk={risk} />
							</DialogContent>
						</Dialog>
					</>
				) : (
					/* The record carries the whole assessment rather than a door to it. */
					<RiskAssessmentBody insight={full} risk={risk} />
				)}
			</section>
		</div>
	);
}
