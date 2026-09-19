import {
	faCircleCheck,
	faEye,
	faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	PieChart,
	PieSlice,
} from "@greenshift/ui";
import { useState } from "react";
import type {
	ProjectRiskLevel,
	ProjectRiskResult,
	ProjectRiskTone,
} from "../lib/project-risk";
import type { WizardForm } from "../lib/use-project-wizard-form";
import { STEP3_SECTIONS } from "./step-3";

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
	submitted: boolean;
}

/* Status colour is semantic, never decorative (DESIGN.md): emerald positive,
 * amber attention, red negative. Each chip carries its word as well. */
const TONE_CHIP: Record<string, string> = {
	Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
	Medium: "bg-amber-100 text-amber-700 border-amber-200",
	High: "bg-red-100 text-red-700 border-red-200",
};

/* The arc carries the level by colour alone, so it repeats the chip's hue. */
const LEVEL_ARC: Record<ProjectRiskLevel, string> = {
	Low: "var(--color-emerald-600)",
	Medium: "var(--color-amber-600)",
	High: "var(--color-red-600)",
};

function ToneChip({ tone }: { tone: ProjectRiskTone }) {
	return (
		<Badge variant="outline" className={tone ? TONE_CHIP[tone] : undefined}>
			{tone ?? "Not filled in"}
		</Badge>
	);
}

/** One uploaded / not uploaded marker. The tick only appears when a file is
 * really there, and the word travels with it. */
function DocumentState({ name }: { name?: string }) {
	if (!name) {
		return (
			<Badge variant="outline" className="shrink-0">
				Not uploaded
			</Badge>
		);
	}
	return (
		<span className="flex shrink-0 items-center gap-1.5 text-sm text-emerald-700">
			<FontAwesomeIcon icon={faCircleCheck} className="size-4" aria-hidden />
			Uploaded
		</span>
	);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-right text-sm font-medium tabular-nums">
				{value || "Not filled in"}
			</dd>
		</div>
	);
}

export function RiskAssessmentBody({
	risk,
}: {
	risk: ProjectRiskResult | null;
}) {
	if (risk === null) {
		return (
			<p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
				Not calculated yet. Complete Steps 1–3.
			</p>
		);
	}
	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-md bg-muted px-4 py-4">
					<div className="relative mx-auto size-40">
						<PieChart
							data={[
								{
									label: "Risk",
									value: risk.score,
									color: LEVEL_ARC[risk.level],
								},
								{
									label: "Remaining",
									value: Math.max(0, 100 - risk.score),
									color: "var(--muted)",
								},
							]}
							size={160}
							innerRadius={56}
							padAngle={0.03}
							cornerRadius={4}
						>
							<PieSlice index={0} />
							<PieSlice index={1} />
						</PieChart>
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
							<p className="text-2xl font-semibold leading-none tabular-nums">
								{risk.score}/100
							</p>
							<ToneChip tone={risk.level} />
						</div>
					</div>
					<p className="mt-2 text-center text-sm text-muted-foreground">
						Project risk score
					</p>
				</div>
				<div className="flex flex-col justify-center rounded-md bg-muted px-4 py-4">
					<p className="text-2xl font-semibold leading-none tabular-nums">
						{risk.success}%
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Probability of success
					</p>
				</div>
			</div>
			<div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
				<Card>
					<CardContent className="space-y-3">
						<p className="text-sm font-semibold">Risk by area</p>
						{risk.breakdown.map((row) => (
							<div key={row.key} className="space-y-1.5">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium">{row.label}</p>
									<ToneChip tone={row.tone} />
								</div>
								<div
									role="progressbar"
									aria-valuenow={row.pct}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label={`Risk for ${row.label}`}
									className="h-2 rounded-full bg-muted"
								>
									<div
										className="h-2 rounded-full bg-primary"
										style={{ width: `${row.pct}%` }}
									/>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
				<Card>
					<CardContent className="space-y-2">
						<p className="text-sm font-semibold">Main Risk Factors</p>
						{risk.factors.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No main risk factors.
							</p>
						) : (
							<ul className="list-disc space-y-1 pl-5 text-sm">
								{risk.factors.map((factor) => (
									<li key={factor}>{factor}</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardContent className="space-y-2">
						<p className="text-sm font-semibold">Mitigation</p>
						<ul className="list-disc space-y-1 pl-5 text-sm">
							{risk.mitigations.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="space-y-2">
						<p className="text-sm font-semibold">Risk Summary</p>
						<p className="text-sm">{risk.summary}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export function Step4View(props: Step4ViewProps) {
	const { form, step1, step2, step1Docs, step3Docs, risk, submitted } = props;
	const [isRiskOpen, setIsRiskOpen] = useState(false);

	const step3Rows = STEP3_SECTIONS.flatMap((section) => section.items).map(
		(doc) => ({ id: doc.id, label: doc.title, name: step3Docs[doc.id] }),
	);
	const step1Rows = step1Docs.map((doc) => ({
		id: doc.id,
		label: doc.label,
		name: doc.name,
	}));
	const documentGroups = [
		{ title: "Step 3 documents", rows: step3Rows },
		{ title: "Step 1 energy documents", rows: step1Rows },
	];
	const uploaded =
		step3Rows.filter((row) => row.name).length +
		step1Rows.filter((row) => row.name).length;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-8">
				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold">
							A. Project &amp; Financial Summary
						</h2>
						<p className="text-sm text-muted-foreground">
							Read-only, taken from Steps 1 and 2.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-md bg-muted px-4 py-3">
							<p className="text-sm font-semibold">Project profile</p>
							<dl className="mt-2 space-y-1.5">
								<SummaryRow label="Project" value={step1.namaProyek} />
								<SummaryRow label="Location" value={step1.lokasi} />
								<SummaryRow label="Sector" value={step1.sektor} />
							</dl>
						</div>
						<div className="rounded-md bg-muted px-4 py-3">
							<p className="text-sm font-semibold">Financial plan</p>
							<dl className="mt-2 space-y-1.5">
								<SummaryRow
									label="CAPEX"
									value={step2.capex ? `Rp ${step2.capex}` : ""}
								/>
								<SummaryRow
									label="Annual saving"
									value={step2.saving ? `Rp ${step2.saving}` : ""}
								/>
								<SummaryRow
									label="Annual revenue"
									value={step2.pendapatan ? `Rp ${step2.pendapatan}` : ""}
								/>
								<SummaryRow
									label="Tenor"
									value={step2.tenor ? `${step2.tenor} years` : ""}
								/>
								<SummaryRow label="Collateral" value={step2.jaminan} />
							</dl>
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold">B. Document Status</h2>
						<p className="text-sm text-muted-foreground">
							{uploaded} of {step3Rows.length + step1Rows.length} documents
							uploaded. A tick means the file is saved with your draft.
						</p>
					</div>
					<Card>
						<CardContent className="space-y-4">
							{documentGroups.map((group) => (
								<div key={group.title}>
									<p className="text-sm font-semibold">{group.title}</p>
									<ul className="mt-1 divide-y divide-border">
										{group.rows.map((row) => (
											<li
												key={row.id}
												className="flex items-center justify-between gap-3 py-2"
											>
												<span className="min-w-0 truncate text-sm">
													{row.label}
												</span>
												<DocumentState name={row.name} />
											</li>
										))}
									</ul>
								</div>
							))}
						</CardContent>
					</Card>
				</section>

				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold">
							B2. Project Risk Assessment
						</h2>
						<p className="text-sm text-muted-foreground">
							Scored from Steps 1–3, not a manual number.
						</p>
					</div>
					{risk === null ? (
						<p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
							Not calculated yet. Complete Steps 1–3.
						</p>
					) : (
						<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-muted px-4 py-3">
							<div className="flex items-center gap-3">
								<p className="text-2xl font-semibold leading-none tabular-nums">
									{risk.score}/100
								</p>
								<ToneChip tone={risk.level} />
							</div>
							<p className="text-sm tabular-nums text-muted-foreground">
								{risk.success}% probability of success
							</p>
						</div>
					)}
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsRiskOpen(true)}
					>
						<FontAwesomeIcon icon={faEye} />
						View the Risk Assessment Detail
					</Button>
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
							<RiskAssessmentBody risk={risk} />
						</DialogContent>
					</Dialog>
				</section>

				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold">
							C. Declaration &amp; Manual Verification
						</h2>
						<p className="text-sm text-muted-foreground">
							Both statements must be ticked. Submit stays disabled until they
							are.
						</p>
					</div>
					<div className="space-y-4">
						<form.AppField name="consent">
							{(field) => (
								<field.CheckboxField label="I agree that the project data may be used for the Green Bond issuance." />
							)}
						</form.AppField>
						<form.AppField name="declaration">
							{(field) => (
								<field.CheckboxField label="The data I entered is accurate and can be verified." />
							)}
						</form.AppField>
					</div>
				</section>

				{submitted && (
					<output className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-3 text-sm">
						<FontAwesomeIcon icon={faFileLines} className="size-4 shrink-0" />
						Submission received. Our team will contact you.
					</output>
				)}
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardContent className="space-y-1">
						<p className="text-sm font-semibold">What Happens Next</p>
						<p className="text-sm text-muted-foreground">
							An initial review takes 3–5 working days. GreenShift will contact
							you about the next verification step.
						</p>
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
