/* How an assessment is presented: the tone chips, the two readings the figures support,
 * Eleanor's note, and the bodies the detail view can take. Shared by both surfaces. */

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BusinessRiskInsight } from "@greenshift/core";
import { Badge, cn, PieChart, PieSlice } from "@greenshift/ui";
import type {
	ProjectRiskBreakdown,
	ProjectRiskLevel,
	ProjectRiskResult,
	ProjectRiskTone,
} from "../lib/project-risk";
import type { RiskInsightState } from "../lib/use-risk-insight";

/* Status colour is semantic, never decorative (DESIGN.md): emerald positive,
 * amber attention, red negative. Each chip carries its word as well. */
export const TONE_CHIP: Record<string, string> = {
	Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
	Medium: "bg-amber-100 text-amber-700 border-amber-200",
	High: "bg-red-100 text-red-700 border-red-200",
};

/* The dial carries the level by colour alone, so it repeats the chip's hue and
 * the chip's word sits beside it. */
export const LEVEL_ARC: Record<ProjectRiskLevel, string> = {
	Low: "var(--color-emerald-600)",
	Medium: "var(--color-amber-600)",
	High: "var(--color-red-600)",
};

export function ToneChip({ tone }: { tone: ProjectRiskTone }) {
	return (
		<Badge variant="outline" className={tone ? TONE_CHIP[tone] : undefined}>
			{tone ?? "Not filled in"}
		</Badge>
	);
}

/** The risk dial: the level's arc, with the score in the middle. */
export function RiskDial({
	score,
	level,
	size = 132,
}: {
	score: number;
	level: ProjectRiskLevel;
	size?: number;
}) {
	return (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<PieChart
				data={[
					{ label: "Risk", value: score, color: LEVEL_ARC[level] },
					{
						label: "Remaining",
						value: Math.max(0, 100 - score),
						color: "var(--muted)",
					},
				]}
				size={size}
				innerRadius={Math.round(size * 0.36)}
				padAngle={0.03}
				cornerRadius={4}
			>
				<PieSlice index={0} />
				<PieSlice index={1} />
			</PieChart>
			<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<p className="text-3xl font-semibold leading-none tabular-nums">
					{score}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">of 100</p>
			</div>
		</div>
	);
}

/** One area as a row: its reading beside its share of the scale. */
export function AreaRow({ row }: { row: ProjectRiskBreakdown }) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-medium">{row.label}</p>
				<div className="flex items-center gap-2">
					<ToneChip tone={row.tone} />
					<p className="text-sm tabular-nums text-muted-foreground">
						{row.pct}/100
					</p>
				</div>
			</div>
			<div
				role="progressbar"
				aria-valuenow={row.pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Risk for ${row.label}`}
				className="h-1.5 rounded-full bg-muted"
			>
				<div
					className="h-1.5 rounded-full bg-primary"
					style={{ width: `${row.pct}%` }}
				/>
			</div>
		</div>
	);
}

/** "A", "A and B", "A, B and C": a list the way a reader expects to see one. */
function listLabels(labels: string[]): string {
	if (labels.length <= 1) return labels[0] ?? "";
	return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** What the four area readings add up to: an unscored area is named as unscored rather
 * than counted as low risk. */
export function areaReading(ranked: ProjectRiskBreakdown[]): string {
	const scored = ranked.filter((row) => row.tone !== null);
	const unscored = ranked.filter((row) => row.tone === null);
	const sentences: string[] = [];

	if (scored.length > 0) {
		const highest = scored[0].pct;
		const lowest = scored[scored.length - 1].pct;
		const top = scored
			.filter((row) => row.pct === highest)
			.map((row) => row.label);
		const bottom = scored
			.filter((row) => row.pct === lowest)
			.map((row) => row.label);
		sentences.push(
			highest === lowest
				? `Every scored area sits at ${highest} of 100, so no single input carries the total.`
				: `${listLabels(top)} ${top.length === 1 ? "carries" : "carry"} the most risk at ${highest} of 100, ${listLabels(bottom)} the least at ${lowest}.`,
		);
	}

	if (unscored.length > 0) {
		const verb = unscored.length === 1 ? "has" : "have";
		const pronoun = unscored.length === 1 ? "it" : "them";
		sentences.push(
			`${listLabels(unscored.map((row) => row.label))} ${verb} no reading yet, because the input behind ${pronoun} is still empty.`,
		);
	}

	return sentences.join(" ");
}

/** What the tone of each reading means for the submission, not a repeat of the labels. */
export function meaningReading(risk: ProjectRiskResult): string {
	const high = risk.breakdown
		.filter((row) => row.tone === "High")
		.map((row) => row.label);
	const medium = risk.breakdown
		.filter((row) => row.tone === "Medium")
		.map((row) => row.label);
	const sentences: string[] = [];

	if (high.length > 0) {
		sentences.push(
			`${listLabels(high)} ${high.length === 1 ? "is" : "are"} scored high, and those readings are what hold the blended score up.`,
		);
	} else if (medium.length > 0) {
		sentences.push(
			`${listLabels(medium)} ${medium.length === 1 ? "sits" : "sit"} in the middle of the scale: enough to move the total, not enough to read as high.`,
		);
	} else {
		sentences.push(
			"No area reads above low, so nothing in the inputs is holding the score up.",
		);
	}

	if (risk.factors.includes("Document completeness is low")) {
		sentences.push("Document completeness is under half of the checklist.");
	}

	return sentences.join(" ");
}

/** Eleanor's half of a risk view: her reading of the assessment, then the work that moves
 * it. Both halves are capped by the caller, since a summary wants only the opening. */
export function EleanorNote({
	state,
	tips,
	maxParagraphs = 2,
	maxTips = 3,
	className,
}: {
	state: RiskInsightState;
	/** The model's own mitigations. Eleanor's prose is never the only advice. */
	tips: string[];
	maxParagraphs?: number;
	maxTips?: number;
	className?: string;
}) {
	const { insight, loading, failed } = state;
	const paragraphs = insight
		? insight.text.split("\n\n").slice(0, maxParagraphs)
		: [];
	const shownTips = tips.slice(0, maxTips);

	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-muted/50 px-5 py-4",
				className,
			)}
		>
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<p className="text-sm font-semibold">Analysis by Eleanor</p>
				<p className="text-sm text-muted-foreground">{sourceLabel(insight)}</p>
			</div>

			{loading && (
				<p className="mt-2 text-sm text-muted-foreground">
					Reading the assessment…
				</p>
			)}
			{failed && (
				<p className="mt-2 text-sm text-muted-foreground">
					{shownTips.length > 0
						? "The written reading is unavailable right now. The tips below come from the scoring model and still stand."
						: "The written reading is unavailable right now. Every figure it would be written from is unchanged."}
				</p>
			)}
			{paragraphs.length > 0 && (
				<div className="mt-2 space-y-2.5">
					{paragraphs.map((paragraph) => (
						<p
							key={paragraph}
							className="whitespace-pre-line text-sm leading-6"
						>
							{paragraph}
						</p>
					))}
				</div>
			)}

			{shownTips.length > 0 && (
				<div className="mt-4 border-t border-border pt-3">
					<p className="text-sm font-medium">Tips</p>
					<ul className="mt-2 space-y-1.5">
						{shownTips.map((tip) => (
							<li
								key={tip}
								className="flex items-start gap-2 text-sm leading-6"
							>
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="mt-1 size-3.5 shrink-0 text-primary"
									aria-hidden
								/>
								<span>{tip}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

/** Who wrote the reading, in the analyst's own terms. */
function sourceLabel(insight: BusinessRiskInsight | null): string {
	if (insight === null) return "";
	return insight.source === "ai"
		? "Written by the analyst model"
		: "Composed from the assessment";
}

/** The assessment as a report: the figures and their readings, with Eleanor's note closing it. */
function ReportBody({
	risk,
	state,
}: {
	risk: ProjectRiskResult;
	state: RiskInsightState;
}) {
	const ranked = [...risk.breakdown].sort((a, b) => b.pct - a.pct);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-5">
				<RiskDial level={risk.level} score={risk.score} />
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<ToneChip tone={risk.level} />
						<p className="text-sm tabular-nums text-muted-foreground">
							{risk.success}% probability of success
						</p>
					</div>
					<p className="max-w-prose text-sm leading-6">{risk.summary}</p>
				</div>
			</div>

			<div className="space-y-3 border-t border-border pt-5">
				<p className="text-sm font-semibold">Risk by area</p>
				<p className="max-w-prose text-sm leading-6">{areaReading(ranked)}</p>
				<div className="space-y-4">
					{ranked.map((row) => (
						<AreaRow key={row.key} row={row} />
					))}
				</div>
			</div>

			<div className="space-y-3 border-t border-border pt-5">
				<p className="text-sm font-semibold">What the readings mean</p>
				<p className="max-w-prose text-sm leading-6">{meaningReading(risk)}</p>
				{risk.factors.length > 0 && (
					<ul className="list-disc space-y-1 pl-5 text-sm">
						{risk.factors.map((factor) => (
							<li key={factor}>{factor}</li>
						))}
					</ul>
				)}
			</div>

			<EleanorNote
				className="border-0 bg-muted"
				state={state}
				tips={risk.mitigations}
			/>
		</div>
	);
}

/** The assessment as the detail view draws it. `insight` is only passed when the caller
 * already holds a reading: an assessment the API returned carries its own. */
export function RiskAssessmentBody({
	risk,
	insight,
}: {
	risk: ProjectRiskResult | null;
	insight?: RiskInsightState;
}) {
	if (risk === null) {
		return (
			<p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
				Not calculated yet. Complete Steps 1–3.
			</p>
		);
	}

	const state: RiskInsightState = insight ?? {
		insight: risk.insight ?? null,
		loading: false,
		failed: false,
	};

	return <ReportBody risk={risk} state={state} />;
}
