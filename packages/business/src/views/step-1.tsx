/* Step 1 of the wizard: the project profile, its current energy situation,
 * targets, overview and the document trio, with the emission-reduction donut
 * and the risk preview in the rail. The step reads the form it is given and
 * reports file changes back; the shell owns the draft and the risk model.
 */

import {
	faChevronDown,
	faCloudArrowUp,
	faCoins,
	faFileLines,
	faGaugeHigh,
	faLocationDot,
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
	cn,
	Input,
	Label,
	PieChart,
	PieSlice,
	useStore,
} from "@greenshift/ui";
import { useMemo, useRef, useState } from "react";
import { loadDistricts } from "../lib/districts";
import { formatId, parseIdNumber } from "../lib/number-format";
import type { ProjectRiskTone, Step1RiskTones } from "../lib/project-risk";
import type { WizardForm } from "../lib/use-project-wizard-form";
import { step1Validator } from "../lib/wizard-rules";

/**
 * The Step 1 checklist. Its slots are also what a resumed file is matched
 * against, and its count is the `docsTotal` the risk model reads.
 */
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

const LOKASI_OPTIONS = [
	"Cikarang, Jawa Barat",
	"Karawang, Jawa Barat",
	"Bekasi, Jawa Barat",
	"Bogor, Jawa Barat",
	"Bandung, Jawa Barat",
	"Cilegon, Banten",
	"Tangerang, Banten",
	"Jakarta Utara, DKI Jakarta",
	"Jakarta Timur, DKI Jakarta",
	"Jakarta Barat, DKI Jakarta",
	"Jakarta Selatan, DKI Jakarta",
	"Semarang, Jawa Tengah",
	"Solo, Jawa Tengah",
	"Yogyakarta, DI Yogyakarta",
	"Surabaya, Jawa Timur",
	"Sidoarjo, Jawa Timur",
	"Gresik, Jawa Timur",
	"Medan, Sumatera Utara",
	"Palembang, Sumatera Selatan",
	"Batam, Kepulauan Riau",
	"Balikpapan, Kalimantan Timur",
	"Makassar, Sulawesi Selatan",
	"Denpasar, Bali",
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

/**
 * The district picker. `SelectField` cannot host it: the list is fetched on the
 * first open, filtered as the user types, and cut to 100 rows with a count
 * underneath. It is an ordinary form field, so it wires its own value, blur and
 * message and repeats the label stack the field bundle draws.
 */
function LokasiField({
	value,
	onChange,
	onBlur,
	error,
}: {
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	/** The field's message, which exists only once the field has been validated. */
	error?: unknown;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [districts, setDistricts] = useState<string[] | null>(null);
	const [failed, setFailed] = useState(false);
	const message = typeof error === "string" ? error : undefined;

	function load() {
		setFailed(false);
		void loadDistricts()
			.then(setDistricts)
			.catch(() => setFailed(true));
	}

	function openList() {
		setOpen(true);
		if (districts === null) load();
	}

	const source = districts ?? LOKASI_OPTIONS;
	const matches = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const found = needle
			? source.filter((option) => option.toLowerCase().includes(needle))
			: source;
		return { total: found.length, shown: found.slice(0, 100) };
	}, [source, query]);

	return (
		<div className="space-y-2">
			<Label htmlFor="lokasi">Location</Label>
			<div className="relative">
				<FontAwesomeIcon
					icon={faLocationDot}
					className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					id="lokasi"
					role="combobox"
					aria-expanded={open}
					aria-controls="lokasi-listbox"
					aria-autocomplete="list"
					aria-invalid={message ? true : undefined}
					aria-describedby={message ? "lokasi-error" : undefined}
					value={open ? query : value}
					onFocus={() => {
						setQuery("");
						openList();
					}}
					onClick={() => {
						if (open) return;
						setQuery("");
						openList();
					}}
					onChange={(event) => {
						setQuery(event.target.value);
						openList();
					}}
					onBlur={onBlur}
					onKeyDown={(event) => {
						if (event.key === "Escape") setOpen(false);
					}}
					placeholder="Type a district…"
					autoComplete="off"
					className="pr-12 pl-9"
				/>
				<button
					type="button"
					tabIndex={-1}
					aria-label="Open location options"
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => {
						setQuery("");
						openList();
					}}
					className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring max-sm:size-11"
				>
					<FontAwesomeIcon icon={faChevronDown} className="size-4" />
				</button>
				{open && (
					<>
						<button
							type="button"
							tabIndex={-1}
							aria-label="Close location options"
							onClick={() => setOpen(false)}
							className="fixed inset-0 z-40 cursor-default"
						/>
						<div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
							<div
								role="listbox"
								id="lokasi-listbox"
								aria-label="District list"
								className="max-h-64 overflow-y-auto p-1"
							>
								{districts === null && !failed && (
									<p className="px-3 py-2 text-sm text-muted-foreground">
										Loading 7,000+ districts…
									</p>
								)}
								{failed && (
									<div className="px-3 py-2">
										<p className="text-sm text-destructive">
											Could not load the full list. Showing a short list.
										</p>
										<button
											type="button"
											onClick={load}
											className="mt-1 rounded text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
										>
											Try again
										</button>
									</div>
								)}
								{matches.shown.map((option) => (
									<button
										key={option}
										type="button"
										role="option"
										aria-selected={option === value}
										onClick={() => {
											onChange(option);
											setOpen(false);
										}}
										className={cn(
											"block w-full truncate rounded px-3 py-2 text-left text-sm",
											option === value
												? "bg-muted font-semibold"
												: "hover:bg-muted",
										)}
									>
										{option}
									</button>
								))}
								{(districts !== null || failed) && matches.total === 0 && (
									<div className="px-3 py-2">
										<p className="text-sm font-medium">No location found</p>
										<p className="mt-1 text-sm text-muted-foreground">
											Try another keyword.
										</p>
									</div>
								)}
							</div>
							{matches.total > 100 && (
								<p className="border-t border-border px-3 py-2 text-sm tabular-nums text-muted-foreground">
									100 of {formatId(matches.total)}. Keep typing.
								</p>
							)}
						</div>
					</>
				)}
			</div>
			{message && (
				<p id="lokasi-error" role="alert" className="text-sm text-destructive">
					{message}
				</p>
			)}
		</div>
	);
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

	/* The donut reflects the target the user has actually typed. With none set it
	   shows nothing achieved, rather than a stand-in figure that would read as the
	   project's own number. */
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
								<LokasiField
									value={field.state.value}
									onChange={field.handleChange}
									onBlur={field.handleBlur}
									error={field.state.meta.errors[0]}
								/>
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
