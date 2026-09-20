import {
	faCircle,
	faCircleCheck,
	faCloudArrowUp,
	faPlus,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	cn,
	Ring,
	RingChart,
	useStore,
} from "@greenshift/ui";
import { useRef } from "react";
import {
	type CreditScoreResult,
	creditScore,
	nextRatingBand,
	SCORE_WEIGHTS,
	STEP2_DOC_TARGET,
} from "../lib/credit-score";
import { formatBytes, formatId, parseIdNumber } from "../lib/number-format";
import type { WizardForm } from "../lib/use-project-wizard-form";
import type { WizardFile } from "../lib/wizard-payload";
import { step2Validator } from "../lib/wizard-rules";

export const JAMINAN_OPTIONS = [
	"Land or building certificate",
	"Machinery and equipment",
	"Trade receivables",
	"Corporate guarantee / letter of comfort",
] as const;

export interface Step2ViewProps {
	form: WizardForm;
	files: WizardFile[];
	onFiles: (files: FileList | null) => void;
	onRemoveFile: (id: string) => void;
	fileError?: string;
	score: CreditScoreResult;
}

/* The upload rules the API enforces, so the hint cannot promise more than it
   accepts. */
const UPLOAD_HINT = "PDF, Excel, PNG or JPG, up to 25 MB each";

const SECTION_HEADERS = [
	{
		letter: "A",
		title: "Project Funding Requirement",
		help: "Capital expenditure, tenor, and the estimated annual saving.",
	},
	{
		letter: "B",
		title: "Short Financial Profile",
		help: "Repayment capacity and form of collateral. The annual repayment follows from the funding terms.",
	},
	{
		letter: "C",
		title: "Financial Documents",
		help: "The statements behind the figures, saved with your draft. At least 1 file.",
	},
] as const;

/** "Laporan-2024.pdf" -> "PDF": the chip says what kind of file it is. */
function fileKind(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot <= 0 || dot === name.length - 1
		? "FILE"
		: name.slice(dot + 1).toUpperCase();
}

/**
 * A step block's heading. The rule underneath is what reads as the boundary
 * between blocks A, B and C, and its letter is what the score panel names when
 * it points back at the fields that feed it.
 */
function SectionHeader({
	letter,
	title,
	help,
}: {
	letter: string;
	title: string;
	help: string;
}) {
	return (
		<div className="border-b border-border pb-3">
			<h2 className="text-lg font-semibold">
				{letter}. {title}
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">{help}</p>
		</div>
	);
}

/**
 * The documents attached to the draft. Empty, the picker is the whole block;
 * once a file is in, the list is the state and adding another is its own
 * action, so a second file never means going back through a control named as if
 * it were the first.
 */
function FinancialDocuments({
	files,
	onFiles,
	onRemoveFile,
	fileError,
}: {
	files: WizardFile[];
	onFiles: (files: FileList | null) => void;
	onRemoveFile: (id: string) => void;
	fileError?: string;
}) {
	const fileRef = useRef<HTMLInputElement | null>(null);
	/* One input for both states, so the picker keeps a single accessible name.
	   Out of the tab order: it is opened by the buttons beside it, and a focus
	   stop on an invisible control is a trap rather than a path. */
	const input = (
		<input
			ref={fileRef}
			type="file"
			multiple
			tabIndex={-1}
			className="sr-only"
			aria-label="Upload financial statements and the cost budget"
			onChange={(event) => {
				onFiles(event.target.files);
				// The same file again after a removal has to fire a change event.
				event.target.value = "";
			}}
		/>
	);

	/* What the row of actions under the list says about the list itself. */
	const attachedLabel = `${files.length} ${
		files.length === 1 ? "file" : "files"
	} attached, saved with your draft`;

	if (files.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8">
				<div className="flex flex-col items-center text-center">
					<FontAwesomeIcon
						icon={faCloudArrowUp}
						className="size-6 text-muted-foreground"
						aria-hidden
					/>
					<p className="mt-3 text-sm font-medium">
						Financial statements and the cost budget
					</p>
					<p className="mt-1 text-sm text-muted-foreground">{UPLOAD_HINT}</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={() => fileRef.current?.click()}
					>
						Choose files
					</Button>
					{input}
					{fileError ? (
						<p role="alert" className="mt-3 text-sm text-destructive">
							{fileError}
						</p>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
				{files.map((file) => (
					<li key={file.id} className="flex items-center gap-3 px-4 py-3.5">
						<span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md bg-muted px-2 text-sm font-semibold text-muted-foreground">
							{fileKind(file.name)}
						</span>
						<p className="min-w-0 flex-1 truncate text-sm font-medium">
							{file.name}
						</p>
						{file.sizeBytes === null ? null : (
							<p className="shrink-0 text-sm tabular-nums text-muted-foreground">
								{formatBytes(file.sizeBytes)}
							</p>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Remove ${file.name}`}
							onClick={() => onRemoveFile(file.id)}
						>
							<FontAwesomeIcon icon={faTrash} aria-hidden />
						</Button>
					</li>
				))}
			</ul>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => fileRef.current?.click()}
				>
					<FontAwesomeIcon icon={faPlus} aria-hidden />
					Add file
				</Button>
				<p className="text-sm text-muted-foreground">{attachedLabel}</p>
				{fileError ? (
					<p role="alert" className="text-sm text-destructive">
						{fileError}
					</p>
				) : null}
				{input}
			</div>
		</div>
	);
}

/**
 * The score is derived from the figures above, so it stays absent until they are
 * in. This says which ones are still open instead of showing a stand-in number.
 */
function MissingInputs({
	capex,
	tenor,
	saving,
}: {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
}) {
	const inputs = [
		{ label: "Total CAPEX", done: capex !== null && capex > 0 },
		{ label: "Financing tenor", done: tenor !== null && tenor > 0 },
		{ label: "Estimated annual saving", done: saving !== null },
	];

	return (
		<div className="rounded-xl border border-dashed border-border px-4 py-5">
			<p className="text-sm font-medium">
				The score appears once Section A has its figures.
			</p>
			<ul className="mt-3 space-y-2">
				{inputs.map((input) => (
					<li key={input.label} className="flex items-center gap-2 text-sm">
						<FontAwesomeIcon
							icon={input.done ? faCircleCheck : faCircle}
							className={cn(
								"size-3.5 shrink-0",
								input.done ? "text-primary" : "text-muted-foreground",
							)}
							aria-hidden
						/>
						<span className={input.done ? "text-muted-foreground" : ""}>
							{input.label}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/** Everything the panel draws, derived once from the live figures. */
interface ScoreReadout {
	total: number;
	rating: string;
	next: { rating: string; min: number } | null;
	fundingPoints: number;
	documentPoints: number;
	coverage: number;
	annualRepayment: number;
	docsDone: number;
	docsTotal: number;
}

/** The figures behind the score, one row per fact. */
function FactsTable({
	annualRepayment,
	coverage,
	docsDone,
	docsTotal,
}: {
	annualRepayment: number;
	coverage: number;
	docsDone: number;
	docsTotal: number;
}) {
	const rows = [
		{ label: "Annual repayment", value: `Rp ${formatId(annualRepayment)}` },
		{
			label: "Saving covers",
			value: `${formatId(Math.round(coverage))}% of the repayment`,
		},
		{ label: "Files attached", value: `${docsDone} of ${docsTotal}` },
	];

	return (
		<dl className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
			{rows.map((row) => (
				<div
					key={row.label}
					className="flex items-center justify-between gap-4 px-4 py-3"
				>
					<dt className="text-sm text-muted-foreground">{row.label}</dt>
					<dd className="text-sm font-semibold tabular-nums">{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

/** The score as a dial, its two parts on their own rings. */
function ScoreDial({ readout }: { readout: ScoreReadout }) {
	const { total, rating, next } = readout;
	const rings = [
		{
			label: "Funding numbers",
			value: readout.fundingPoints,
			maxValue: SCORE_WEIGHTS.funding,
			color: "var(--primary)",
		},
		{
			label: "Documents",
			value: readout.documentPoints,
			maxValue: SCORE_WEIGHTS.documents,
			color: "var(--chart-3)",
		},
	];

	return (
		<div className="space-y-4">
			<div className="relative mx-auto w-fit">
				<RingChart
					data={rings}
					size={184}
					strokeWidth={14}
					ringGap={8}
					baseInnerRadius={48}
				>
					<Ring index={0} />
					<Ring index={1} />
				</RingChart>
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<p className="text-4xl font-bold leading-none tabular-nums text-primary">
						{total}
					</p>
					<p className="mt-1.5 text-sm text-muted-foreground">of 100</p>
				</div>
			</div>

			<div className="text-center">
				<p className="text-sm text-muted-foreground">Credit rating</p>
				<p className="mt-1 text-2xl font-semibold leading-none">{rating}</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{next
						? `${next.rating} at ${next.min} points, ${next.min - total} more.`
						: "This is the top band."}
				</p>
			</div>

			<dl className="space-y-2.5">
				{rings.map((ring) => (
					<div
						key={ring.label}
						className="flex items-center justify-between gap-3"
					>
						<dt className="flex items-center gap-2 text-sm text-muted-foreground">
							<span
								className="size-2.5 shrink-0 rounded-full"
								style={{ background: ring.color }}
								aria-hidden
							/>
							{ring.label}
						</dt>
						<dd className="text-sm font-semibold tabular-nums">
							{ring.value}{" "}
							<span className="font-normal text-muted-foreground">
								of {ring.maxValue}
							</span>
						</dd>
					</div>
				))}
			</dl>

			<FactsTable
				annualRepayment={readout.annualRepayment}
				coverage={readout.coverage}
				docsDone={readout.docsDone}
				docsTotal={readout.docsTotal}
			/>
		</div>
	);
}

/**
 * The score panel. The model runs once with no documents counted, which leaves
 * the funding part alone, so the document part is what the attachments added on
 * top of it and the two parts always add up to the number on screen.
 */
function CreditScoringPanel({
	score,
	capex,
	tenor,
	saving,
	docsDone,
	docsTotal,
}: {
	score: CreditScoreResult;
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	docsDone: number;
	docsTotal: number;
}) {
	const { score: total, rating } = score;
	const annualRepayment =
		capex !== null && tenor !== null && tenor > 0 ? capex / tenor : null;
	const fundingPoints = creditScore({
		capex,
		tenor,
		saving,
		docsDone: 0,
		docsTotal: 0,
	}).score;

	if (
		total === null ||
		rating === null ||
		fundingPoints === null ||
		annualRepayment === null ||
		annualRepayment <= 0 ||
		saving === null
	) {
		return <MissingInputs capex={capex} saving={saving} tenor={tenor} />;
	}

	const readout: ScoreReadout = {
		total,
		rating,
		next: nextRatingBand(total),
		fundingPoints,
		documentPoints: total - fundingPoints,
		coverage: (saving / annualRepayment) * 100,
		annualRepayment,
		docsDone,
		docsTotal,
	};

	return <ScoreDial readout={readout} />;
}

export function Step2View({
	form,
	files,
	onFiles,
	onRemoveFile,
	fileError,
	score,
}: Step2ViewProps) {
	const values = useStore(form.store, (state) => state.values);
	const capex = parseIdNumber(values.capex);
	const tenor = parseIdNumber(values.tenor);
	const saving = parseIdNumber(values.saving);
	const annualRepayment =
		capex !== null && tenor !== null && tenor > 0 ? capex / tenor : null;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			{/* One block per heading, each ruled off and set well apart from the
			    next: the fields of two blocks are never read as one grid. */}
			<div className="min-w-0 space-y-10">
				<section className="space-y-4">
					<SectionHeader {...SECTION_HEADERS[0]} />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="capex"
							validators={{ onChange: step2Validator(form, "capex") }}
						>
							{(field) => (
								<field.NumberField
									label="Total CAPEX"
									prefix="Rp"
									placeholder="4.200.000.000"
									min={0}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="tenor"
							validators={{ onChange: step2Validator(form, "tenor") }}
						>
							{(field) => (
								<field.NumberField
									label="Financing Tenor"
									unit="years"
									inputMode="numeric"
									placeholder="10"
									min={1}
									max={30}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="saving"
							validators={{ onChange: step2Validator(form, "saving") }}
						>
							{(field) => (
								<field.NumberField
									label="Estimated Annual Saving"
									prefix="Rp"
									placeholder="500.000.000"
									min={0}
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<SectionHeader {...SECTION_HEADERS[1]} />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="pendapatan"
							validators={{ onChange: step2Validator(form, "pendapatan") }}
						>
							{(field) => (
								<field.NumberField
									label="Company Annual Revenue"
									prefix="Rp"
									placeholder="10.000.000.000"
									min={0}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="jaminan"
							validators={{ onChange: step2Validator(form, "jaminan") }}
						>
							{(field) => (
								<field.SelectField
									label="Form of Collateral"
									placeholder="Choose collateral"
									options={JAMINAN_OPTIONS}
								/>
							)}
						</form.AppField>
						<div className="rounded-lg bg-muted px-3 py-3">
							<p className="text-sm text-muted-foreground">
								Annual repayment · CAPEX ÷ tenor
							</p>
							<p
								className={cn(
									"mt-1 text-lg tabular-nums",
									annualRepayment === null
										? "text-muted-foreground"
										: "font-semibold",
								)}
							>
								{annualRepayment === null
									? "Not filled in"
									: `Rp ${formatId(annualRepayment)}`}
							</p>
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<SectionHeader {...SECTION_HEADERS[2]} />
					<FinancialDocuments
						files={files}
						onFiles={onFiles}
						onRemoveFile={onRemoveFile}
						fileError={fileError}
					/>
				</section>
			</div>

			{/* The panel moves with the figures it reads, so it stays in view while
			    the fields that feed it are being filled in. */}
			<aside className="min-w-0 xl:sticky xl:top-24">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Credit Scoring Simulation</CardTitle>
						<CardDescription>
							Derived from the funding figures and the documents in this step.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CreditScoringPanel
							capex={capex}
							docsDone={files.length}
							docsTotal={STEP2_DOC_TARGET}
							saving={saving}
							score={score}
							tenor={tenor}
						/>
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
