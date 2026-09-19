import {
	faArrowLeft,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { creditScore } from "./lib/credit-score";
import { loadDistricts } from "./lib/districts";
import { formatId, parseIdNumber } from "./lib/number-format";
import { projectRisk } from "./lib/project-risk";
import {
	type DraftResume,
	type SaveState,
	useBusinessDraft,
} from "./lib/use-business-draft";
import {
	useProjectWizardForm,
	WIZARD_VALUES,
	type WizardFieldName,
	type WizardValues,
} from "./lib/use-project-wizard-form";
import { validateStep1, validateStep2 } from "./lib/validators";
import { step1Validator, step1Values, step2Values } from "./lib/wizard-rules";
import { Step2View } from "./views/step-2";
import { STEP3_SECTIONS, Step3View } from "./views/step-3";
import { Step4View } from "./views/step-4";

type RiskTone = "Low" | "Medium" | "High" | "Not filled in";

function riskVariant(tone: RiskTone) {
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

/** A resumed number keeps the display format its field expects back. */
function formatField(value: number): string {
	return formatId(value, Number.isInteger(value) ? 0 : 2);
}

/** The autosave line, empty until the first save is about to happen. */
function saveLabel(state: SaveState, loading: boolean): string {
	if (loading) return "Opening your draft…";
	switch (state) {
		case "saving":
			return "Saving…";
		case "saved":
			return "Draft saved.";
		case "failed":
			return "Not saved. Retrying; your work stays in this tab.";
		default:
			return "";
	}
}

/* The four step circles share one ramp. A state adds to it and never cancels it. */
const STEP_CIRCLE =
	"flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums sm:size-8";

/* Only a completed step is clickable, so the interactive classes live here. */
const STEP_LINK = cn(
	STEP_CIRCLE,
	"outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring",
);

const STEP_STATE = {
	active: "bg-primary text-primary-foreground",
	completed: "border border-primary/40 bg-primary/10 text-primary",
	upcoming: "border border-border bg-muted text-muted-foreground",
} as const;

const STEPS = [
	"Profile & Needs",
	"Financial Viability",
	"Supporting Documents",
	"Review & Submit",
];

/* The strip names the steps only where it has the width for them, so phones get
   the active step's purpose instead. */
const STEP_SUBTITLES = [
	"Base energy data and the goal of the project. Step 1 of 4.",
	"The funding need and the repayment capacity. Step 2 of 4.",
	"Legal and GHG LVV technical documents. Step 3 of 4.",
	"Check the summary before you submit. Step 4 of 4.",
];

const REQUIRED_DOCS = [
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

/**
 * The form fields the user has put a value into at least once. It is what tells
 * an autosave apart: a field emptied after holding a value is sent as `null`
 * (cleared), while one that never held one is left out, because the API reads a
 * present-but-empty string as a value and rejects it.
 */
type FilledFields = Set<WizardFieldName>;

function filledText(
	filled: FilledFields,
	name: WizardFieldName,
	value: string,
) {
	if (value.trim()) {
		filled.add(name);
		return value;
	}
	return filled.has(name) ? null : undefined;
}

function filledNumber(
	filled: FilledFields,
	name: WizardFieldName,
	raw: string,
) {
	const parsed = parseIdNumber(raw);
	if (parsed !== null) {
		filled.add(name);
		return parsed;
	}
	return filled.has(name) ? null : undefined;
}

/** The Step 1 half of one autosave, in the wire names the API uses. */
function step1Patch(values: WizardValues, filled: FilledFields) {
	return {
		namaProyek: filledText(filled, "namaProyek", values.namaProyek),
		lokasi: filledText(filled, "lokasi", values.lokasi),
		sektor: filledText(filled, "sektor", values.sektor),
		konsumsiMwh: filledNumber(filled, "konsumsi", values.konsumsi),
		biayaRp: filledNumber(filled, "biaya", values.biaya),
		faktorEmisi: filledNumber(filled, "faktor", values.faktor),
		targetPct: filledNumber(filled, "targetPct", values.targetPct),
		targetMwh: filledNumber(filled, "targetMwh", values.targetMwh),
		timeline: filledText(filled, "timeline", values.timeline),
		ringkasan: filledText(filled, "ringkasan", values.ringkasan),
	};
}

/** The Step 2 half. `fileIds` always travels, because an empty list is a value. */
function step2Patch(
	values: WizardValues,
	filled: FilledFields,
	fileIds: string[],
) {
	return {
		capexRp: filledNumber(filled, "capex", values.capex),
		tenorTahun: filledNumber(filled, "tenor", values.tenor),
		penghematanRp: filledNumber(filled, "saving", values.saving),
		pendapatanRp: filledNumber(filled, "pendapatan", values.pendapatan),
		jaminan: filledText(filled, "jaminan", values.jaminan),
		fileIds,
	};
}

/**
 * The stored draft in the shape the form holds it: numbers come back through
 * `formatField`, so the number shown is the number the user typed.
 */
function resumeValues(resume: DraftResume): WizardValues {
	const step1 = resume.step1 ?? {};
	const step2 = resume.step2 ?? {};
	const asField = (value: number | null | undefined, fallback: string) =>
		value != null ? formatField(value) : fallback;
	return {
		...WIZARD_VALUES,
		namaProyek: step1.namaProyek ?? WIZARD_VALUES.namaProyek,
		lokasi: step1.lokasi ?? WIZARD_VALUES.lokasi,
		sektor: step1.sektor ?? WIZARD_VALUES.sektor,
		konsumsi: asField(step1.konsumsiMwh, WIZARD_VALUES.konsumsi),
		biaya: asField(step1.biayaRp, WIZARD_VALUES.biaya),
		faktor: asField(step1.faktorEmisi, WIZARD_VALUES.faktor),
		targetPct: asField(step1.targetPct, WIZARD_VALUES.targetPct),
		targetMwh: asField(step1.targetMwh, WIZARD_VALUES.targetMwh),
		timeline: step1.timeline ?? WIZARD_VALUES.timeline,
		ringkasan: step1.ringkasan ?? WIZARD_VALUES.ringkasan,
		capex: asField(step2.capexRp, WIZARD_VALUES.capex),
		tenor: asField(step2.tenorTahun, WIZARD_VALUES.tenor),
		saving: asField(step2.penghematanRp, WIZARD_VALUES.saving),
		pendapatan: asField(step2.pendapatanRp, WIZARD_VALUES.pendapatan),
		jaminan: step2.jaminan ?? WIZARD_VALUES.jaminan,
	};
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

export function BusinessSubmit() {
	const form = useProjectWizardForm();
	const values = useStore(form.store, (state) => state.values);

	/* ADR-006: wizard shell state: the active step and whether Save and continue
	   has been pressed on it. */
	const [activeStep, setActiveStep] = useState(0);
	/* Save and continue is what turns a step's whole rule map on. Until it is
	   pressed, a field only speaks for itself, and only once it is touched. */
	const [step1Attempted, setStep1Attempted] = useState(false);
	const [step2Attempted, setStep2Attempted] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	/* Step 1 documents (ADR-003): slot to the name shown, and slot to the
	   document id submit sends. Uploads are imperative, not form fields. */
	const [uploaded, setUploaded] = useState<Record<string, string>>({});
	const [uploadedIds, setUploadedIds] = useState<Record<string, string>>({});
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

	/* Step 2 documents (ADR-004) */
	const [finFiles, setFinFiles] = useState<string[]>([]);
	const [finFileIds, setFinFileIds] = useState<string[]>([]);

	/* Step 3 documents (ADR-005) */
	const [step3Docs, setStep3Docs] = useState<Record<string, string>>({});
	const [step3Ids, setStep3Ids] = useState<Record<string, string>>({});

	/* Draft persistence. A stored draft seeds every step in one reset, which the
	   hook applies while it is still holding autosave back, so the seeded values
	   are never written over the stored ones. */
	const filled = useRef<FilledFields>(new Set());
	const draft = useBusinessDraft((resume) => {
		form.reset(resumeValues(resume));
		// Four screens on screen, three payload steps: the review screen still
		// belongs to the third.
		if (resume.step != null && resume.step > 1) {
			setActiveStep(Math.min(resume.step, 3));
		}
	});

	/** The payload step for the screen the user is on. */
	const draftStep: 1 | 2 | 3 = activeStep <= 0 ? 1 : activeStep === 1 ? 2 : 3;

	// Autosave both blocks whenever a value changes. The hook debounces, and it
	// stays quiet until the resume above has been applied.
	useEffect(() => {
		draft.saveStep({
			step: draftStep,
			step1: step1Patch(values, filled.current),
			step2: step2Patch(values, filled.current, finFileIds),
		});
	}, [draft.saveStep, draftStep, values, finFileIds]);

	const konsumsiNum = parseIdNumber(values.konsumsi);
	const biayaNum = parseIdNumber(values.biaya);
	const faktorNum = parseIdNumber(values.faktor);
	const targetNum = parseIdNumber(values.targetPct);
	const targetMwhNum = parseIdNumber(values.targetMwh);
	const capexNum = parseIdNumber(values.capex);
	const tenorNum = parseIdNumber(values.tenor);
	const savingNum = parseIdNumber(values.saving);
	const pendapatanNum = parseIdNumber(values.pendapatan);

	const docsDone = REQUIRED_DOCS.filter((doc) => uploaded[doc.id]).length;
	const timelineMatch = values.timeline.match(/(\d{4})/);
	const timelineYear = timelineMatch ? Number(timelineMatch[1]) : null;
	const currentYear = new Date().getFullYear();

	/* ADR-003: the risk is derived from the inputs, never a stored number. */
	const riskFinansial: RiskTone =
		biayaNum === null
			? "Not filled in"
			: biayaNum > 5_000_000_000
				? "High"
				: biayaNum > 1_000_000_000
					? "Medium"
					: "Low";
	const riskTeknis: RiskTone =
		konsumsiNum === null
			? "Not filled in"
			: konsumsiNum > 10_000
				? "High"
				: konsumsiNum > 2_000
					? "Medium"
					: "Low";
	const riskImplementasi: RiskTone =
		timelineYear === null && docsDone === 0
			? "Not filled in"
			: docsDone === 0 ||
					(timelineYear !== null && timelineYear < currentYear + 1)
				? "High"
				: docsDone < REQUIRED_DOCS.length
					? "Medium"
					: "Low";

	/* ADR-003: the donut reflects the target the user has actually typed. With
	   none set it shows nothing achieved, rather than a stand-in figure that
	   would read as the project's own number. */
	const targetValid = targetNum !== null && targetNum >= 0 && targetNum <= 100;
	const donutPct = targetValid ? targetNum : 0;
	const baseline =
		konsumsiNum !== null &&
		konsumsiNum >= 0 &&
		faktorNum !== null &&
		faktorNum >= 0
			? konsumsiNum * faktorNum
			: null;
	const pengurangan = baseline !== null ? (baseline * donutPct) / 100 : null;

	const score = creditScore({
		capex: capexNum,
		tenor: tenorNum,
		saving: savingNum,
		docsDone: finFiles.length,
		docsTotal: 2,
	});

	/* ---- Step 4 derived risk (ADR-006.7: Step 1 trio + Step 3 six + finFiles) ---- */
	const step3Done = STEP3_SECTIONS.flatMap((section) => section.items).filter(
		(item) => step3Docs[item.id],
	).length;
	const riskDocsDone = docsDone + step3Done + finFiles.length;
	const riskDocsTotal =
		REQUIRED_DOCS.length +
		STEP3_SECTIONS.reduce((count, section) => count + section.items.length, 0) +
		2;
	const riskInputsEmpty =
		riskFinansial === "Not filled in" &&
		riskTeknis === "Not filled in" &&
		riskImplementasi === "Not filled in" &&
		score.score === null &&
		riskDocsDone === 0;
	const riskAssessment = riskInputsEmpty
		? null
		: projectRisk({
				finansial: riskFinansial === "Not filled in" ? null : riskFinansial,
				teknis: riskTeknis === "Not filled in" ? null : riskTeknis,
				implementasi:
					riskImplementasi === "Not filled in" ? null : riskImplementasi,
				creditScore: score.score,
				docsDone: riskDocsDone,
				docsTotal: riskDocsTotal,
			});

	/* The current step's rules over live form values. One map drives the field
	   messages, the step gate and the banner count, so they cannot disagree. */
	const step1Messages = validateStep1(step1Values(values));
	const step2Messages = validateStep2(step2Values(values, finFiles.length));
	const errorCount =
		activeStep === 0
			? Object.keys(step1Messages).length
			: activeStep === 1
				? Object.keys(step2Messages).length
				: 0;
	const attempted =
		activeStep === 0
			? step1Attempted
			: activeStep === 1
				? step2Attempted
				: false;

	async function handleFile(id: string, file: File | undefined) {
		if (!file) return;
		const docId = await draft.uploadDocument(file, id);
		if (!docId) return;
		setUploaded((prev) => ({ ...prev, [id]: file.name }));
		setUploadedIds((prev) => ({ ...prev, [id]: docId }));
	}

	async function removeStep1Doc(slot: string) {
		const docId = uploadedIds[slot];
		if (docId) await draft.removeDocument(docId);
		setUploaded((prev) => {
			const next = { ...prev };
			delete next[slot];
			return next;
		});
		setUploadedIds((prev) => {
			const next = { ...prev };
			delete next[slot];
			return next;
		});
	}

	async function handleFinFiles(files: FileList | null) {
		if (!files) return;
		for (const file of Array.from(files)) {
			const docId = await draft.uploadDocument(file, "lapkeu");
			if (!docId) continue;
			setFinFiles((prev) => [...prev, file.name]);
			setFinFileIds((prev) => [...prev, docId]);
		}
	}

	async function removeFinFile(index: number) {
		const docId = finFileIds[index];
		if (docId) await draft.removeDocument(docId);
		setFinFiles((prev) => prev.filter((_, i) => i !== index));
		setFinFileIds((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleStep3Upload(id: string, file: File | undefined) {
		if (!file) return;
		const docId = await draft.uploadDocument(file, id);
		if (!docId) return;
		setStep3Docs((prev) => ({ ...prev, [id]: file.name }));
		setStep3Ids((prev) => ({ ...prev, [id]: docId }));
	}

	async function handleStep3Remove(id: string) {
		const docId = step3Ids[id];
		if (docId) await draft.removeDocument(docId);
		setStep3Docs((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setStep3Ids((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	}

	/* ---- Shell navigation (ADR-006.1 + 006.6) ----
	   The strip's rule needs no bookkeeping: a step only advances on an empty rule
	   map, so every step behind the active one has been completed and is a link,
	   and every step ahead of it is inert until the wizard arrives there. */

	/**
	 * Save and continue. Every message the step's rules produce is shown at once,
	 * so one press reports the whole step rather than one field at a time, and the
	 * step only advances on an empty map. Steps 3 and 4 carry no data rules.
	 */
	async function handleNext() {
		if (activeStep === 0) {
			setStep1Attempted(true);
			await form.validateAllFields("change");
			if (Object.keys(step1Messages).length > 0) return;
			setActiveStep(1);
			return;
		}
		if (activeStep === 1) {
			setStep2Attempted(true);
			await form.validateAllFields("change");
			if (Object.keys(step2Messages).length > 0) return;
			setActiveStep(2);
			return;
		}
		setActiveStep(activeStep + 1);
	}

	function handleBack() {
		setActiveStep((step) => Math.max(0, step - 1));
	}

	/**
	 * Sends the draft. The server revalidates, scores it and returns the created
	 * project, so nothing here decides the outcome.
	 */
	async function handleSubmitProject() {
		// The client rules run again, so a value that went missing fails here
		// instead of being sent as a zero.
		if (
			Object.keys(step1Messages).length > 0 ||
			Object.keys(step2Messages).length > 0
		) {
			return;
		}
		if (
			konsumsiNum === null ||
			biayaNum === null ||
			faktorNum === null ||
			targetNum === null ||
			targetMwhNum === null ||
			capexNum === null ||
			tenorNum === null ||
			savingNum === null ||
			pendapatanNum === null ||
			!values.jaminan
		) {
			return;
		}

		// Every Step 3 slot is sent, with null for the ones not provided, so the
		// checklist state the user sees is the state the server records.
		const docStates: Record<string, string | null> = {};
		for (const section of STEP3_SECTIONS) {
			for (const item of section.items) {
				docStates[item.id] = step3Ids[item.id] ?? null;
			}
		}

		const project = await draft.submit({
			step1: {
				namaProyek: values.namaProyek,
				lokasi: values.lokasi,
				sektor: values.sektor,
				konsumsiMwh: konsumsiNum,
				biayaRp: biayaNum,
				faktorEmisi: faktorNum,
				targetPct: targetNum,
				targetMwh: targetMwhNum,
				timeline: values.timeline,
				ringkasan: values.ringkasan,
			},
			step2: {
				capexRp: capexNum,
				tenorTahun: tenorNum,
				penghematanRp: savingNum,
				pendapatanRp: pendapatanNum,
				jaminan: values.jaminan,
				fileIds: finFileIds,
			},
			step3: { docStates },
			consent: values.consent,
			declaration: values.declaration,
		});

		if (project) {
			setSubmitted(true);
		}
	}

	return (
		<div className="space-y-6">
			{/* The wizard's own header: step strip on top, action bar below, spanning
			    the shell's scroll container edge to edge. It is the only sticky
			    element, so the step bodies add no offset of their own. */}
			<header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 py-2 sm:-mx-6 sm:px-6">
				<ol
					aria-label="Submission steps"
					className="flex items-center justify-between gap-2"
				>
					{STEPS.map((step, i) => {
						const active = i === activeStep;
						const completed = i < activeStep;
						return (
							<li key={step} className="flex min-w-0 items-center gap-2">
								{completed ? (
									<button
										type="button"
										onClick={() => setActiveStep(i)}
										aria-label={`Go back to step ${i + 1}: ${step}`}
										className={cn(STEP_LINK, STEP_STATE.completed)}
									>
										{`0${i + 1}`}
									</button>
								) : (
									<span
										aria-current={active ? "step" : undefined}
										className={cn(
											STEP_CIRCLE,
											active ? STEP_STATE.active : STEP_STATE.upcoming,
										)}
									>
										{`0${i + 1}`}
									</span>
								)}
								<span
									className={cn(
										"hidden truncate text-sm lg:inline",
										active ? "font-semibold" : "text-muted-foreground",
									)}
								>
									{step}
								</span>
							</li>
						);
					})}
				</ol>
				<p className="mt-1 text-sm text-muted-foreground lg:hidden">
					{STEP_SUBTITLES[activeStep]}
				</p>
				<div className="mt-2 flex items-center justify-between gap-3">
					<output
						className={cn(
							"min-w-0 text-sm",
							draft.saveState === "failed"
								? "text-destructive"
								: "text-muted-foreground",
						)}
					>
						{saveLabel(draft.saveState, draft.loading)}
					</output>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="secondary"
							disabled={activeStep === 0}
							onClick={handleBack}
						>
							<FontAwesomeIcon icon={faArrowLeft} />
							Back
						</Button>
						{activeStep < 3 ? (
							<Button type="button" onClick={() => void handleNext()}>
								Save &amp; continue
							</Button>
						) : (
							<Button
								type="button"
								disabled={
									!values.consent || !values.declaration || draft.submitting
								}
								onClick={() => void handleSubmitProject()}
							>
								Submit the Project
							</Button>
						)}
					</div>
				</div>
			</header>

			{attempted && errorCount > 0 && (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{errorCount} {errorCount === 1 ? "field is" : "fields are"} not valid
					yet. Check the message under each field.
				</p>
			)}

			{activeStep === 0 && (
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
							<h2 className="text-lg font-semibold">
								D. Short Project Overview
							</h2>
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
								<h2 className="text-lg font-semibold">
									E. Documents to Prepare
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{docsDone}/{REQUIRED_DOCS.length} uploaded · saved with your
									draft.
								</p>
							</div>
							<Card>
								<CardContent className="divide-y divide-border">
									{REQUIRED_DOCS.map((doc) => {
										const name = uploaded[doc.id];
										return (
											<div
												key={doc.id}
												className="flex items-center justify-between gap-3 py-3"
											>
												<div className="flex min-w-0 items-center gap-3">
													<FontAwesomeIcon
														icon={doc.icon}
														className="size-4 shrink-0 text-muted-foreground"
													/>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium">
															{doc.label}
														</p>
														<p className="truncate text-sm text-muted-foreground">
															{name ?? "No file yet"}
														</p>
													</div>
												</div>
												<div className="flex shrink-0 items-center gap-2">
													<input
														ref={(element) => {
															fileRefs.current[doc.id] = element;
														}}
														type="file"
														className="sr-only"
														aria-label={`Upload ${doc.label}`}
														onChange={(event) =>
															void handleFile(doc.id, event.target.files?.[0])
														}
													/>
													{name ? (
														<>
															<Badge>Uploaded</Badge>
															<Button
																type="button"
																variant="ghost"
																size="icon-sm"
																aria-label={`Remove ${doc.label}`}
																onClick={() => void removeStep1Doc(doc.id)}
															>
																<FontAwesomeIcon icon={faTrash} />
															</Button>
														</>
													) : (
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => fileRefs.current[doc.id]?.click()}
														>
															<FontAwesomeIcon icon={faCloudArrowUp} />
															Upload
														</Button>
													)}
												</div>
											</div>
										);
									})}
								</CardContent>
							</Card>
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
								{(
									[
										{
											label: "Financial",
											tone: riskFinansial,
											icon: faCoins,
										},
										{
											label: "Technical",
											tone: riskTeknis,
											icon: faScrewdriverWrench,
										},
										{
											label: "Implementation",
											tone: riskImplementasi,
											icon: faGaugeHigh,
										},
									] as const
								).map((row) => (
									<div
										key={row.label}
										className="flex items-center justify-between gap-3 py-3"
									>
										<div className="flex min-w-0 items-center gap-2">
											<FontAwesomeIcon
												icon={row.icon}
												className="size-4 shrink-0 text-muted-foreground"
											/>
											<span className="truncate text-sm font-medium">
												{row.label}
											</span>
										</div>
										<Badge variant={riskVariant(row.tone)}>{row.tone}</Badge>
									</div>
								))}
							</CardContent>
						</Card>
					</aside>
				</div>
			)}

			{activeStep === 1 && (
				<Step2View
					form={form}
					files={finFiles}
					onFiles={(files) => void handleFinFiles(files)}
					onRemoveFile={(index) => void removeFinFile(index)}
					fileError={step2Attempted ? step2Messages.files : undefined}
					score={score}
				/>
			)}

			{activeStep === 2 && (
				<Step3View
					docs={step3Docs}
					onUpload={(id, file) => void handleStep3Upload(id, file)}
					onRemove={(id) => void handleStep3Remove(id)}
				/>
			)}

			{activeStep === 3 && (
				<Step4View
					form={form}
					step1={{
						namaProyek: values.namaProyek,
						lokasi: values.lokasi,
						sektor: values.sektor,
					}}
					step2={{
						capex: values.capex,
						tenor: values.tenor,
						saving: values.saving,
						pendapatan: values.pendapatan,
						jaminan: values.jaminan,
					}}
					step1Docs={REQUIRED_DOCS.map((doc) => ({
						id: doc.id,
						label: doc.label,
						name: uploaded[doc.id],
					}))}
					step3Docs={step3Docs}
					risk={riskAssessment}
					submitted={submitted}
				/>
			)}
		</div>
	);
}
