/* Step 1: the project profile, its current energy situation, targets, overview and the
 * document trio, with the donut and risk preview in the rail. The shell owns the draft. */

import {
	faCloudArrowUp,
	faCoins,
	faFileLines,
	faGaugeHigh,
	faMoneyBillWave,
	faScrewdriverWrench,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistrictCombobox,
	Label,
	PieChart,
	PieSlice,
	useStore,
} from "@greenshift/ui";
import { useRef } from "react";
import { formatId, parseIdNumber } from "../lib/number-format";
import type { ProjectRiskTone, Step1RiskTones } from "../lib/project-risk";
import type { WizardForm } from "../lib/use-project-wizard-form";
import { step1Validator } from "../lib/wizard-rules";

/** The Step 1 checklist. Its slots are also what a resumed file is matched against, and
 * its count is the `docsTotal` the risk model reads. */
export const REQUIRED_DOCS = [
	{
		id: "tagihan",
		label: "12 months of electricity bills",
		icon: faMoneyBillWave,
	},
	{ id: "beban", label: "Load profile / account", icon: faGaugeHigh },
	{ id: "izin", label: "Site permit / legality", icon: faFileLines },
] as const;

const SEKTOR_OPTIONS = [
	"Manufacturing",
	"Commercial",
	"Industrial",
	"Public",
	"Agriculture",
];

/* Rolling quarter options (12 = 3 years from Jan of current year). */
function buildQuarterOptions(now: Date = new Date()): string[] {
	const out: string[] = [];
	for (let y = now.getFullYear(); y < now.getFullYear() + 3; y += 1) {
		for (let q = 1; q <= 4; q += 1) out.push(`Q${q} ${y}`);
	}
	return out;
}

/** The badge tone for a risk row. Null is "not filled in", not a tone. */
function riskVariant(tone: ProjectRiskTone) {
	switch (tone) {
		case "Low":
			return "default" as const;
		case "Medium":
			return "secondary" as const;
		case "High":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
}

export interface Step1ViewProps {
	form: WizardForm;
	/** The three tones the risk model reads, derived by the shell from these fields. */
	tones: Step1RiskTones;
	/** Slot to file name, which is also how many of the three are in. */
	uploaded: Record<string, string>;
	onUpload: (id: string, file: File | undefined) => void;
	onRemove: (id: string) => void;
}

export function Step1View({
	form,
	tones,
	uploaded,
	onUpload,
	onRemove,
}: Step1ViewProps) {
	const values = useStore(form.store, (state) => state.values);
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

	const docsDone = REQUIRED_DOCS.filter((doc) => uploaded[doc.id]).length;

	/* The donut reflects the target the user typed: with none set it shows nothing
	   achieved, rather than a stand-in figure that would read as the project's own number. */
	const targetNum = parseIdNumber(values.targetPct);
	const targetValid = targetNum !== null && targetNum >= 0 && targetNum <= 100;
	const donutPct = targetValid ? targetNum : 0;
	const konsumsiNum = parseIdNumber(values.konsumsi);
	const faktorNum = parseIdNumber(values.faktor);
	const baseline =
		konsumsiNum !== null &&
		konsumsiNum >= 0 &&
		faktorNum !== null &&
		faktorNum >= 0
			? konsumsiNum * faktorNum
			: null;
	const pengurangan = baseline !== null ? (baseline * donutPct) / 100 : null;

	const riskRows = [
		{ label: "Financial", tone: tones.finansial, icon: faCoins },
		{ label: "Technical", tone: tones.teknis, icon: faScrewdriverWrench },
		{
			label: "Implementation",
			tone: tones.implementasi,
			icon: faGaugeHigh,
		},
	] as const;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-8">
				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">A. Project Profile</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							The basic identity of the project you are submitting.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="namaProyek"
							validators={{ onChange: step1Validator(form, "namaProyek") }}
						>
							{(field) => (
								<field.TextField
									label="Project name"
									placeholder="Rooftop solar, Cikarang plant"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="lokasi"
							validators={{ onChange: step1Validator(form, "lokasi") }}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="lokasi">Location</Label>
									<DistrictCombobox
										id="lokasi"
										value={field.state.value}
										onChange={field.handleChange}
										onBlur={field.handleBlur}
										error={
											typeof field.state.meta.errors[0] === "string"
												? field.state.meta.errors[0]
												: undefined
										}
									/>
								</div>
							)}
						</form.AppField>
						<form.AppField
							name="sektor"
							validators={{ onChange: step1Validator(form, "sektor") }}
						>
							{(field) => (
								<field.SelectField
									label="Sector"
									placeholder="Choose a sector"
									options={SEKTOR_OPTIONS}
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">
							B. Current Energy Situation
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Copy them from the paper documents and type the numbers in.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="konsumsi"
							validators={{ onChange: step1Validator(form, "konsumsi") }}
						>
							{(field) => (
								<field.NumberField
									label="Energy consumption"
									unit="MWh/year"
									placeholder="12.500,5"
									min={0}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="biaya"
							validators={{ onChange: step1Validator(form, "biaya") }}
						>
							{(field) => (
								<field.NumberField
									label="Energy cost"
									prefix="Rp"
									placeholder="4.200.000.000"
									min={0}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="faktor"
							validators={{ onChange: step1Validator(form, "faktor") }}
						>
							{(field) => (
								<field.NumberField
									label="Emission factor"
									unit="tCO₂/MWh"
									placeholder="0,85"
									min={0}
									max={10}
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">C. Project Targets</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Quantitative targets and the operation date.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="targetPct"
							validators={{ onChange: step1Validator(form, "targetPct") }}
						>
							{(field) => (
								<field.NumberField
									label="Emission reduction target"
									unit="%"
									placeholder="45"
									min={0}
									max={100}
									inputMode="numeric"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="targetMwh"
							validators={{ onChange: step1Validator(form, "targetMwh") }}
						>
							{(field) => (
								<field.NumberField
									label="Clean energy target"
									unit="MWh/year"
									placeholder="8.000"
									min={0}
								/>
							)}
						</form.AppField>
						<form.AppField
							name="timeline"
							validators={{ onChange: step1Validator(form, "timeline") }}
						>
							{(field) => (
								<field.SelectField
									label="Planned commercial operation"
									options={buildQuarterOptions()}
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">D. Short Project Overview</h2>
					<form.AppField
						name="ringkasan"
						validators={{ onChange: step1Validator(form, "ringkasan") }}
					>
						{(field) => (
							<field.TextareaField
								label="Overview"
								description={`${values.ringkasan.trim().length}/1000 characters · minimum 50.`}
								placeholder="Describe the current setup, the technology you propose, and the result you expect…"
								maxLength={1000}
							/>
						)}
					</form.AppField>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">E. Documents to Prepare</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							{docsDone}/{REQUIRED_DOCS.length} uploaded · saved with your
							draft.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{REQUIRED_DOCS.map((doc) => {
							const name = uploaded[doc.id];
							return (
								<Card key={doc.id}>
									<CardContent className="flex flex-col gap-3">
										<div className="flex min-w-0 items-start gap-2">
											<FontAwesomeIcon
												icon={doc.icon}
												className="mt-0.5 size-4 shrink-0 text-muted-foreground"
											/>
											<div className="min-w-0">
												<p className="text-sm font-medium">{doc.label}</p>
												<p className="mt-1 truncate text-sm text-muted-foreground">
													{name ?? "No file yet"}
												</p>
											</div>
										</div>
										<input
											ref={(element) => {
												fileRefs.current[doc.id] = element;
											}}
											type="file"
											tabIndex={-1}
											className="sr-only"
											aria-label={`Upload ${doc.label}`}
											onChange={(event) =>
												onUpload(doc.id, event.target.files?.[0])
											}
										/>
										{name ? (
											<div className="flex items-center justify-between gap-2">
												<Badge>Uploaded</Badge>
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													aria-label={`Remove ${doc.label}`}
													onClick={() => onRemove(doc.id)}
												>
													<FontAwesomeIcon icon={faTrash} aria-hidden />
												</Button>
											</div>
										) : (
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => fileRefs.current[doc.id]?.click()}
											>
												<FontAwesomeIcon icon={faCloudArrowUp} aria-hidden />
												Upload
											</Button>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				</section>
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Emission Reduction Target Summary
						</CardTitle>
					</CardHeader>
					<CardContent className="grid items-center gap-4">
						<div className="relative mx-auto h-[200px] w-[200px]">
							<PieChart
								data={[
									{
										label: "Target",
										value: donutPct,
										color: "var(--primary)",
									},
									{
										label: "Remaining",
										value: Math.max(0, 100 - donutPct),
										color: "var(--muted)",
									},
								]}
								size={200}
								innerRadius={70}
								padAngle={0.03}
								cornerRadius={4}
							>
								<PieSlice index={0} />
								<PieSlice index={1} />
							</PieChart>
							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
								<p className="text-3xl leading-none font-semibold tabular-nums">
									{formatId(donutPct, donutPct % 1 === 0 ? 0 : 1)}%
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									{targetValid ? "project target" : "Not filled in"}
								</p>
							</div>
						</div>
						<dl className="space-y-2">
							<div className="flex items-center justify-between gap-4">
								<dt className="text-sm text-muted-foreground">Baseline</dt>
								<dd className="text-sm font-semibold tabular-nums">
									{baseline !== null
										? `${formatId(baseline, 1)} tCO₂`
										: "Not filled in"}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-sm text-muted-foreground">Reduction</dt>
								<dd className="text-sm font-semibold tabular-nums">
									{pengurangan !== null
										? `${formatId(pengurangan, 1)} tCO₂`
										: "Not filled in"}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-sm text-muted-foreground">Target</dt>
								<dd className="text-sm font-semibold tabular-nums">
									{baseline !== null && pengurangan !== null
										? `${formatId(baseline - pengurangan, 1)} tCO₂`
										: "Not filled in"}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Risk Preview</CardTitle>
						<CardDescription>
							Derived from the inputs on the left.
						</CardDescription>
					</CardHeader>
					<CardContent className="divide-y divide-border">
						{riskRows.map((row) => (
							<div
								key={row.label}
								className="flex items-center justify-between gap-3 py-3"
							>
								<div className="flex min-w-0 items-center gap-2">
									<FontAwesomeIcon
										icon={row.icon}
										className="size-4 shrink-0 text-muted-foreground"
										aria-hidden
									/>
									<span className="truncate text-sm font-medium">
										{row.label}
									</span>
								</div>
								<Badge variant={riskVariant(row.tone)}>
									{row.tone ?? "Not filled in"}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
