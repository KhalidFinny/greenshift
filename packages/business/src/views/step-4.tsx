/* Step 4 of the wizard: the review the user submits on.
 *
 * A reads the project and its money back as a report rather than a row of
 * fields; B lists the documents of both checklist steps; B2 pairs the risk
 * number with Eleanor's reading of it; C carries the two declarations.
 *
 * Three areas carry a variant switch, each kept side by side for review. Once
 * one is picked per area the other two go.
 */

import { faCircleCheck, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Bar,
	BarChart,
	BarXAxis,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Grid,
} from "@greenshift/ui";
import { useState } from "react";
import { formatId, parseIdNumber } from "../lib/number-format";
import type { ProjectRiskResult } from "../lib/project-risk";
import { useProjectReading } from "../lib/use-project-reading";
import type { WizardForm } from "../lib/use-project-wizard-form";
import { type RiskInsightState, useRiskInsight } from "../lib/use-risk-insight";
import {
	AreaRow,
	EleanorNote,
	RiskAssessmentBody,
	ToneChip,
} from "./risk-assessment";
import { STEP3_SECTIONS } from "./step-3";

/* The two statements submit is gated on, in the order the form holds them. */
const DECLARATIONS = [
	{
		field: "consent",
		label:
			"I agree that the project data may be used for the Green Bond issuance.",
		description:
			"Covers the project data, the uploaded documents, and the risk assessment derived from them.",
	},
	{
		field: "declaration",
		label: "I confirm the data I entered is accurate and can be verified.",
		description:
			"Figures and documents are checked against this statement during the initial review.",
	},
] as const;

export interface Step1Summary {
	namaProyek: string;
	lokasi: string;
	sektor: string;
}

export interface Step2Summary {
	capex: string;
	tenor: string;
	saving: string;
	pendapatan: string;
	jaminan: string;
}

export interface Step4ViewProps {
	form: WizardForm;
	step1: Step1Summary;
	step2: Step2Summary;
	step1Docs: { id: string; label: string; name?: string }[];
	step3Docs: Record<string, string>;
	risk: ProjectRiskResult | null;
}

/** The money figures as numbers, for the charts and the ratios. */
interface PlanFigures {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	revenue: number | null;
}

/**
 * What the figures say when they are read against each other. Every value here
 * is arithmetic over the two steps, so the summary states a relationship rather
 * than repeating a number the user already typed.
 */
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

function readFigures(step2: Step2Summary): PlanFigures {
	return {
		capex: parseIdNumber(step2.capex),
		tenor: parseIdNumber(step2.tenor),
		saving: parseIdNumber(step2.saving),
		revenue: parseIdNumber(step2.pendapatan),
	};
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

/** A rupiah figure, or the words for one that is not there yet. */
function rupiah(value: number | null): string {
	return value === null ? "Not filled in" : `Rp ${formatId(value)}`;
}

function years(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(value, 1)} years`;
}

function percent(value: number | null): string {
	return value === null ? "Not filled in" : `${formatId(Math.round(value))}%`;
}

/** The chart the summary leans on: the three annual figures against the
 * capital, in the rupiah the user entered. */
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

/** The saving against the repayment it has to cover: the ratio the whole
 * funding case turns on, so it gets its own bar. */
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
					{percent(coveragePct)}
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
					? `The saving covers the ${rupiah(annualRepayment)} repayment in full.`
					: `The saving leaves ${rupiah(annualRepayment - (annualRepayment * covered) / 100)} of the repayment to operations.`}
				{paybackYears !== null
					? ` The capital is recovered in ${years(paybackYears)} at this saving.`
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

/** How A reads the project and its figures back: the analyst's reading on one
 * side, the charts behind it on the other. */
function SummarySection({
	step2,
	readings,
	figures,
	reading,
}: {
	step2: Step2Summary;
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
						{step2.tenor ? `, over a ${step2.tenor}-year tenor` : ""}.
					</p>
				</div>
				<CoverageMeter readings={readings} />
			</div>
		</div>
	);
}

/** The tick only appears when a file is really there, and the state is spelled
 * out beside it. */
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
function DocumentGroup({
	title,
	step,
	rows,
}: {
	title: string;
	step: string;
	rows: { id: string; label: string; name?: string }[];
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
							<p
								className="mt-1 truncate text-sm text-muted-foreground"
								title={row.name}
							>
								{row.name}
							</p>
						) : (
							<p className="mt-1 text-sm text-muted-foreground">
								Upload it in {step}.
							</p>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

/** B2: the risk number on one side, Eleanor's reading of it on the other. */
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
		/* Half and half: the number and its areas on one side, her reading on the
		   other, so neither reads as the lesser column. */
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

export function Step4View(props: Step4ViewProps) {
	const { form, step1, step2, step1Docs, step3Docs, risk } = props;
	const [isRiskOpen, setIsRiskOpen] = useState(false);
	/* Two readings of the same assessment: the summary panel holds the two
	   sentences, the detail view the whole note. */
	const brief = useRiskInsight(risk, "brief");
	const full = useRiskInsight(risk, "full");
	const reading = useProjectReading({
		namaProyek: step1.namaProyek,
		lokasi: step1.lokasi,
		sektor: step1.sektor,
		capex: step2.capex,
		tenor: step2.tenor,
		saving: step2.saving,
		pendapatan: step2.pendapatan,
		jaminan: step2.jaminan,
	});

	const figures = readFigures(step2);
	const readings = readPlan(figures);

	const step3Rows = STEP3_SECTIONS.flatMap((section) => section.items).map(
		(doc) => ({ id: doc.id, label: doc.title, name: step3Docs[doc.id] }),
	);
	/* Step 1 first: the energy documents are what the money figures were read
	   from, so they precede the legal and technical pack. */
	const step1Rows = step1Docs.map((doc) => ({
		id: doc.id,
		label: doc.label,
		name: doc.name,
	}));
	const uploaded =
		step3Rows.filter((row) => row.name).length +
		step1Rows.filter((row) => row.name).length;

	return (
		<div className="space-y-10">
			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">
						A. Project &amp; Financial Summary
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Read-only, taken from Steps 1 and 2.
					</p>
				</div>
				<SummarySection
					figures={figures}
					readings={readings}
					reading={reading}
					step2={step2}
				/>
			</section>

			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">B. Document Status</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{uploaded} of {step3Rows.length + step1Rows.length} documents
						uploaded. A tick means the file is saved with your draft.
					</p>
				</div>
				<div className="space-y-6">
					<DocumentGroup
						rows={step1Rows}
						step="Step 1"
						title="Step 1 energy documents"
					/>
					<DocumentGroup
						rows={step3Rows}
						step="Step 3"
						title="Step 3 legal and technical documents"
					/>
				</div>
			</section>

			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">B2. Project Risk Assessment</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Scored from Steps 1–3, not a manual number.
					</p>
				</div>
				{risk === null ? (
					<p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
						Not calculated yet. Complete Steps 1–3.
					</p>
				) : (
					<RiskPair
						insight={brief}
						risk={risk}
						onOpen={() => setIsRiskOpen(true)}
					/>
				)}
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
			</section>

			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">
						C. Declaration &amp; Manual Verification
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Submitting this project puts it on record with GreenShift. Agree to
						both terms below, or submit stays disabled.
					</p>
				</div>
				<ol className="divide-y divide-border border-y border-border">
					{DECLARATIONS.map((declaration, index) => (
						<li key={declaration.field} className="flex items-start gap-4 py-4">
							<span
								aria-hidden
								className="mt-0.5 w-4 shrink-0 text-sm tabular-nums text-muted-foreground"
							>
								{index + 1}
							</span>
							<form.AppField name={declaration.field}>
								{(field) => (
									<field.CheckboxField
										label={declaration.label}
										description={declaration.description}
									/>
								)}
							</form.AppField>
						</li>
					))}
				</ol>

				{/* What pressing Submit does, in the order it happens. */}
				<div className="rounded-xl border border-border bg-muted/50 px-5 py-4">
					<p className="text-sm font-semibold">What happens after you submit</p>
					<p className="mt-1.5 text-sm leading-6">
						The project is sent to an LVV body for verification. Once it is
						verified, you are notified here, and the project moves on to vendor
						matchmaking, where you choose the vendor that carries it out.
					</p>
				</div>
			</section>
		</div>
	);
}
