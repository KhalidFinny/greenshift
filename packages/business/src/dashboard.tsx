import {
	faArrowLeft,
	faArrowRight,
	faBolt,
	faBuilding,
	faBullseye,
	faCalendarDays,
	faChevronDown,
	faCloudArrowUp,
	faCoins,
	faFileLines,
	faGaugeHigh,
	faIndustry,
	faLocationDot,
	faMoneyBillWave,
	faPenToSquare,
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
	Input,
	Label,
	PieChart,
	PieSlice,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { useMemo, useRef, useState } from "react";
import { creditScore } from "./lib/credit-score";
import { loadDistricts } from "./lib/districts";
import { formatId, parseIdNumber } from "./lib/number-format";
import { projectRisk } from "./lib/project-risk";
import { validateStep1, validateStep2 } from "./lib/validators";
import { Step2View } from "./views/step-2";
import { STEP3_SECTIONS, Step3View } from "./views/step-3";
import { Step4View } from "./views/step-4";

type RiskTone = "Rendah" | "Sedang" | "Tinggi" | "Belum diisi";

function riskVariant(tone: RiskTone) {
	switch (tone) {
		case "Rendah":
			return "default" as const;
		case "Sedang":
			return "secondary" as const;
		case "Tinggi":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
}

/* ADR-006: COMPANY names; supersede ADR-003.5 placeholder names. */
const STEPS = [
	"Profil & Kebutuhan",
	"Kelayakan Finansial",
	"Dokumen Pendukung",
	"Review & Kirim",
];

const STEP_SUBTITLES = [
	"Lengkapi data dasar energi dan tujuan proyek. Langkah 1 dari 4.",
	"Kebutuhan pendanaan dan kapasitas pembayaran. Langkah 2 dari 4.",
	"Legalitas dan dokumen teknis LVV GRK. Langkah 3 dari 4.",
	"Periksa ringkasan sebelum kirim. Langkah 4 dari 4.",
];

const REQUIRED_DOCS = [
	{ id: "tagihan", label: "Tagihan listrik 12 bulan", icon: faMoneyBillWave },
	{ id: "beban", label: "Profil beban / rekening", icon: faGaugeHigh },
	{ id: "izin", label: "Izin lokasi / legalitas", icon: faFileLines },
] as const;

const SEKTOR_OPTIONS = [
	"Manufaktur",
	"Komersial",
	"Industri",
	"Publik",
	"Pertanian",
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

export function BusinessDashboard() {
	/* ADR-006: wizard shell state — single activeStep + per-step validity. */
	const [activeStep, setActiveStep] = useState(0);
	const [stepValid, setStepValid] = useState<boolean[]>([
		false,
		false,
		false,
		false,
	]);

	/* ---- Step 1 state (unchanged) ---- */
	const [namaProyek, setNamaProyek] = useState("");
	const [lokasi, setLokasi] = useState("");
	const [lokasiOpen, setLokasiOpen] = useState(false);
	const [lokasiQuery, setLokasiQuery] = useState("");
	const [districts, setDistricts] = useState<string[] | null>(null);
	const [districtsError, setDistrictsError] = useState(false);

	function retryDistricts() {
		setDistrictsError(false);
		void loadDistricts()
			.then(setDistricts)
			.catch(() => setDistrictsError(true));
	}

	function openLokasi() {
		setLokasiOpen(true);
		if (districts === null) retryDistricts();
	}
	const lokasiSource = districts ?? LOKASI_OPTIONS;
	const lokasiMatches = useMemo(() => {
		const q = lokasiQuery.trim().toLowerCase();
		const all = q
			? lokasiSource.filter((o) => o.toLowerCase().includes(q))
			: lokasiSource;
		return { total: all.length, shown: all.slice(0, 100) };
	}, [lokasiSource, lokasiQuery]);
	const [sektor, setSektor] = useState("");
	const [konsumsi, setKonsumsi] = useState("");
	const [biaya, setBiaya] = useState("");
	const [faktor, setFaktor] = useState("");
	const [targetPct, setTargetPct] = useState("");
	const [targetMwh, setTargetMwh] = useState("");
	const [timeline, setTimeline] = useState("Q1 2026");
	const [ringkasan, setRingkasan] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [uploaded, setUploaded] = useState<Record<string, string>>({});
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

	const konsumsiNum = useMemo(() => parseIdNumber(konsumsi), [konsumsi]);
	const biayaNum = useMemo(() => parseIdNumber(biaya), [biaya]);
	const faktorNum = useMemo(() => parseIdNumber(faktor), [faktor]);
	const targetNum = useMemo(() => parseIdNumber(targetPct), [targetPct]);
	const targetMwhNum = useMemo(() => parseIdNumber(targetMwh), [targetMwh]);
	const timelineYear = useMemo(() => {
		const m = timeline.match(/(\d{4})/);
		return m ? Number(m[1]) : null;
	}, [timeline]);

	const targetValid = targetNum !== null && targetNum >= 0 && targetNum <= 100;
	/* ADR-003: donut hidup, fallback 45% sesuai mock saat kosong. */
	const donutPct = targetValid ? targetNum : 45;
	const baseline =
		konsumsiNum !== null &&
		konsumsiNum >= 0 &&
		faktorNum !== null &&
		faktorNum >= 0
			? konsumsiNum * faktorNum
			: null;
	const pengurangan = baseline !== null ? (baseline * donutPct) / 100 : null;

	const docsDone = REQUIRED_DOCS.filter((d) => uploaded[d.id]).length;

	/* ADR-003: risiko turunan dari input. */
	const riskFinansial: RiskTone =
		biayaNum === null
			? "Belum diisi"
			: biayaNum > 5_000_000_000
				? "Tinggi"
				: biayaNum > 1_000_000_000
					? "Sedang"
					: "Rendah";
	const riskTeknis: RiskTone =
		konsumsiNum === null
			? "Belum diisi"
			: konsumsiNum > 10_000
				? "Tinggi"
				: konsumsiNum > 2_000
					? "Sedang"
					: "Rendah";
	const currentYear = new Date().getFullYear();
	const riskImplementasi: RiskTone =
		timelineYear === null && docsDone === 0
			? "Belum diisi"
			: docsDone === 0 ||
					(timelineYear !== null && timelineYear < currentYear + 1)
				? "Tinggi"
				: docsDone < REQUIRED_DOCS.length
					? "Sedang"
					: "Rendah";

	function handleFile(id: string, file: File | undefined) {
		if (!file) return;
		setUploaded((prev) => ({ ...prev, [id]: file.name }));
	}

	function validate(): boolean {
		const e = validateStep1({
			namaProyek,
			lokasi,
			sektor,
			konsumsi: konsumsiNum,
			biaya: biayaNum,
			faktor: faktorNum,
			targetPct: targetNum,
			targetMwh: targetMwhNum,
			timeline,
			ringkasan,
		});
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	/* ---- Step 2 state (ADR-004) ---- */
	const [capex, setCapex] = useState("");
	const [tenor, setTenor] = useState("");
	const [saving, setSaving] = useState("");
	const [pendapatan, setPendapatan] = useState("");
	const [jaminan, setJaminan] = useState("");
	const [finFiles, setFinFiles] = useState<string[]>([]);
	const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

	const capexNum = useMemo(() => parseIdNumber(capex), [capex]);
	const tenorNum = useMemo(() => parseIdNumber(tenor), [tenor]);
	const savingNum = useMemo(() => parseIdNumber(saving), [saving]);
	const pendapatanNum = useMemo(() => parseIdNumber(pendapatan), [pendapatan]);
	const score = useMemo(
		() =>
			creditScore({
				capex: capexNum,
				tenor: tenorNum,
				saving: savingNum,
				docsDone: finFiles.length,
				docsTotal: 2,
			}),
		[capexNum, tenorNum, savingNum, finFiles.length],
	);

	function validate2(): boolean {
		const e = validateStep2({
			capex: capexNum,
			tenor: tenorNum,
			saving: savingNum,
			pendapatan: pendapatanNum,
			jaminan,
			fileCount: finFiles.length,
		});
		setStep2Errors(e);
		return Object.keys(e).length === 0;
	}

	function handleFinFiles(files: FileList | null) {
		if (!files) return;
		setFinFiles((prev) => [...prev, ...Array.from(files, (f) => f.name)]);
	}

	/* ---- Step 3 state (ADR-005; NIB ships Uploaded demo state) ---- */
	const [step3Docs, setStep3Docs] = useState<Record<string, string>>({
		nib: "NIB-8120101234567.pdf",
	});

	function handleStep3Upload(id: string, file: File | undefined) {
		if (!file) return;
		setStep3Docs((prev) => ({ ...prev, [id]: file.name }));
	}

	function handleStep3Remove(id: string) {
		setStep3Docs((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	}
	/* ---- Step 4 derived risk (ADR-006.7; Step 1 trio + Step 3 six + finFiles) ---- */
	const step3Done = STEP3_SECTIONS.flatMap((s) => s.items).filter(
		(d) => step3Docs[d.id],
	).length;
	const riskDocsDone = docsDone + step3Done + finFiles.length;
	const riskDocsTotal =
		REQUIRED_DOCS.length +
		STEP3_SECTIONS.reduce((n, s) => n + s.items.length, 0) +
		2;
	const riskInputsEmpty =
		riskFinansial === "Belum diisi" &&
		riskTeknis === "Belum diisi" &&
		riskImplementasi === "Belum diisi" &&
		score.score === null &&
		riskDocsDone === 0;
	const riskAssessment = riskInputsEmpty
		? null
		: projectRisk({
				finansial: riskFinansial === "Belum diisi" ? null : riskFinansial,
				teknis: riskTeknis === "Belum diisi" ? null : riskTeknis,
				implementasi:
					riskImplementasi === "Belum diisi" ? null : riskImplementasi,
				creditScore: score.score,
				docsDone: riskDocsDone,
				docsTotal: riskDocsTotal,
			});

	/* ---- Step 4 state (ADR-006: local confirmation only) ---- */
	const [consent, setConsent] = useState(false);
	const [declaration, setDeclaration] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	/* ---- Shell navigation (ADR-006.1 + 006.6) ---- */
	function markValid(step: number) {
		setStepValid((prev) => prev.map((v, i) => (i === step ? true : v)));
	}

	function handleNext() {
		if (activeStep === 0) {
			if (!validate()) return;
			markValid(0);
			setActiveStep(1);
		} else if (activeStep === 1) {
			if (!validate2()) return;
			markValid(1);
			setActiveStep(2);
		} else if (activeStep === 2) {
			markValid(2);
			setActiveStep(3);
		}
	}

	function handleBack() {
		setActiveStep((s) => Math.max(0, s - 1));
	}

	function canGo(step: number): boolean {
		if (step <= activeStep) return true;
		for (let k = 0; k < step; k += 1) {
			if (!stepValid[k]) return false;
		}
		return true;
	}

	const visibleErrors =
		activeStep === 0 ? errors : activeStep === 1 ? step2Errors : {};

	const err = (key: string) =>
		errors[key] ? (
			<p role="alert" className="mt-1 text-base text-destructive">
				{errors[key]}
			</p>
		) : null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">
					Ajukan Proyek Transisi Energi
				</h1>
				<p className="mt-1 text-base text-muted-foreground">
					{STEP_SUBTITLES[activeStep]}
				</p>
			</div>

			<ol
				aria-label="Langkah pengajuan"
				className="flex gap-2 overflow-x-auto border-b border-border pb-4"
			>
				{STEPS.map((step, i) => {
					const active = i === activeStep;
					const allowed = canGo(i);
					return (
						<li key={step} className="flex shrink-0 items-center gap-2">
							{allowed && !active ? (
								<button
									type="button"
									onClick={() => setActiveStep(i)}
									aria-label={`Kembali ke langkah ${i + 1}: ${step}`}
									className="flex size-7 items-center justify-center rounded-full border border-border bg-muted text-base font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									{`0${i + 1}`}
								</button>
							) : (
								<span
									aria-current={active ? "step" : undefined}
									className={
										active
											? "flex size-7 items-center justify-center rounded-full text-base font-semibold text-primary-foreground"
											: "flex size-7 items-center justify-center rounded-full border border-border bg-muted text-base font-semibold text-muted-foreground"
									}
									style={active ? { background: "#00712D" } : undefined}
								>
									{`0${i + 1}`}
								</span>
							)}
							<span
								className={
									active
										? "text-base font-semibold"
										: "text-base text-muted-foreground"
								}
							>
								{step}
							</span>
							{i < STEPS.length - 1 && (
								<span aria-hidden="true" className="mx-2 h-px w-8 bg-border" />
							)}
						</li>
					);
				})}
			</ol>

			{Object.keys(visibleErrors).length > 0 && (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-base text-destructive"
				>
					Ada {Object.keys(visibleErrors).length} field belum valid. Periksa
					pesan di bawah tiap field.
				</p>
			)}

			{activeStep === 0 && (
				<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
					<div className="min-w-0 space-y-6">
						<Card className="overflow-visible!">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FontAwesomeIcon icon={faBuilding} className="size-4" />
									A. Profil Proyek
								</CardTitle>
								<CardDescription className="text-base">
									Identitas dasar proyek yang diajukan.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-3">
								<div>
									<Label htmlFor="nama-proyek" className="text-base">
										Nama proyek
									</Label>
									<Input
										id="nama-proyek"
										value={namaProyek}
										onChange={(ev) => setNamaProyek(ev.target.value)}
										placeholder="PLTS Atap Pabrik Cikarang"
										aria-invalid={Boolean(errors.namaProyek)}
										className="mt-1 h-10 text-base"
									/>
									{err("namaProyek")}
								</div>
								<div>
									<Label htmlFor="lokasi" className="text-base">
										Lokasi
									</Label>
									<div className="relative mt-1">
										<FontAwesomeIcon
											icon={faLocationDot}
											className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="lokasi"
											role="combobox"
											aria-expanded={lokasiOpen}
											aria-controls="lokasi-listbox"
											aria-autocomplete="list"
											value={lokasiOpen ? lokasiQuery : lokasi}
											onFocus={() => {
												setLokasiQuery("");
												openLokasi();
											}}
											onClick={() => {
												if (!lokasiOpen) {
													setLokasiQuery("");
													openLokasi();
												}
											}}
											onChange={(ev) => {
												setLokasiQuery(ev.target.value);
												openLokasi();
											}}
											onKeyDown={(ev) => {
												if (ev.key === "Escape") setLokasiOpen(false);
											}}
											placeholder="Ketik kecamatan…"
											autoComplete="off"
											aria-invalid={Boolean(errors.lokasi)}
											className="h-10 pl-9 pr-9 text-base"
										/>
										<button
											type="button"
											tabIndex={-1}
											aria-label="Buka pilihan lokasi"
											onMouseDown={(ev) => ev.preventDefault()}
											onClick={() => {
												setLokasiQuery("");
												openLokasi();
											}}
											className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
										>
											<FontAwesomeIcon
												icon={faChevronDown}
												className="size-4"
											/>
										</button>
										{lokasiOpen && (
											<>
												<button
													type="button"
													tabIndex={-1}
													aria-label="Tutup pilihan lokasi"
													onClick={() => setLokasiOpen(false)}
													className="fixed inset-0 z-40 cursor-default"
												/>
												<div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
													<div
														role="listbox"
														id="lokasi-listbox"
														aria-label="Daftar kecamatan"
														className="max-h-64 overflow-y-auto p-1"
													>
														{districts === null && !districtsError && (
															<p className="px-3 py-2 text-base text-muted-foreground">
																Memuat 7.000+ kecamatan…
															</p>
														)}
														{districtsError && (
															<div className="px-3 py-2">
																<p className="text-base text-destructive">
																	Gagal memuat daftar penuh. Menampilkan daftar
																	ringkas.
																</p>
																<button
																	type="button"
																	onClick={retryDistricts}
																	className="mt-1 rounded text-base font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/30"
																>
																	Coba lagi
																</button>
															</div>
														)}
														{lokasiMatches.shown.map((opt) => (
															<button
																key={opt}
																type="button"
																role="option"
																aria-selected={opt === lokasi}
																onClick={() => {
																	setLokasi(opt);
																	setLokasiOpen(false);
																}}
																className={
																	opt === lokasi
																		? "block w-full truncate rounded bg-muted px-3 py-2 text-left text-base font-semibold"
																		: "block w-full truncate rounded px-3 py-2 text-left text-base hover:bg-muted"
																}
															>
																{opt}
															</button>
														))}
														{(districts !== null || districtsError) &&
															lokasiMatches.total === 0 && (
																<div className="px-3 py-2">
																	<p className="text-base font-medium">
																		Lokasi tidak ditemukan
																	</p>
																	<p className="mt-1 text-base text-muted-foreground">
																		Coba kata kunci lain.
																	</p>
																</div>
															)}
													</div>
													{lokasiMatches.total > 100 && (
														<p className="border-t border-border px-3 py-2 text-base tabular-nums text-muted-foreground">
															100 dari {formatId(lokasiMatches.total)} —
															lanjutkan mengetik.
														</p>
													)}
												</div>
											</>
										)}
									</div>
									{err("lokasi")}
								</div>
								<div>
									<Label htmlFor="sektor" className="text-base">
										Sektor
									</Label>
									<Select value={sektor} onValueChange={setSektor}>
										<SelectTrigger id="sektor" className="mt-1 w-full">
											<SelectValue placeholder="Pilih sektor" />
										</SelectTrigger>
										<SelectContent>
											{SEKTOR_OPTIONS.map((opt) => (
												<SelectItem key={opt} value={opt}>
													{opt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{err("sektor")}
								</div>
							</CardContent>
						</Card>

						<section aria-labelledby="section-b">
							<div className="mb-3">
								<h2
									id="section-b"
									className="flex items-center gap-2 text-lg font-semibold"
								>
									<FontAwesomeIcon icon={faBolt} className="size-4" />
									B. Kondisi Energi Saat Ini
								</h2>
								<p className="mt-1 text-base text-muted-foreground">
									Salin dari dokumen fisik. Tanpa grafik — ketik angkanya.
								</p>
							</div>
							<div className="grid gap-4 lg:grid-cols-3">
								<Card>
									<CardContent className="space-y-2 pt-6">
										<Label
											htmlFor="konsumsi"
											className="flex items-center gap-2 text-base font-semibold"
										>
											<FontAwesomeIcon icon={faGaugeHigh} className="size-5" />
											Konsumsi energi
										</Label>
										<div className="flex items-center gap-2">
											<Input
												id="konsumsi"
												inputMode="decimal"
												value={konsumsi}
												onChange={(ev) => setKonsumsi(ev.target.value)}
												placeholder="12.500,5"
												aria-invalid={Boolean(errors.konsumsi)}
												aria-describedby="konsumsi-unit"
												className="h-12 text-lg tabular-nums"
											/>
											<span
												id="konsumsi-unit"
												className="shrink-0 text-base text-muted-foreground"
											>
												MWh/thn
											</span>
										</div>
										{err("konsumsi")}
									</CardContent>
								</Card>
								<Card>
									<CardContent className="space-y-2 pt-6">
										<Label
											htmlFor="biaya"
											className="flex items-center gap-2 text-base font-semibold"
										>
											<FontAwesomeIcon icon={faCoins} className="size-5" />
											Biaya energi
										</Label>
										<div className="flex items-center gap-2">
											<span
												aria-hidden="true"
												className="shrink-0 text-base text-muted-foreground"
											>
												Rp
											</span>
											<Input
												id="biaya"
												inputMode="decimal"
												value={biaya}
												onChange={(ev) => setBiaya(ev.target.value)}
												placeholder="4.200.000.000"
												aria-invalid={Boolean(errors.biaya)}
												className="h-12 text-lg tabular-nums"
											/>
										</div>
										{err("biaya")}
									</CardContent>
								</Card>
								<Card>
									<CardContent className="space-y-2 pt-6">
										<Label
											htmlFor="faktor"
											className="flex items-center gap-2 text-base font-semibold"
										>
											<FontAwesomeIcon icon={faIndustry} className="size-5" />
											Faktor emisi
										</Label>
										<div className="flex items-center gap-2">
											<Input
												id="faktor"
												inputMode="decimal"
												value={faktor}
												onChange={(ev) => setFaktor(ev.target.value)}
												placeholder="0,85"
												aria-invalid={Boolean(errors.faktor)}
												aria-describedby="faktor-unit"
												className="h-12 text-lg tabular-nums"
											/>
											<span
												id="faktor-unit"
												className="shrink-0 text-base text-muted-foreground"
											>
												tCO₂/MWh
											</span>
										</div>
										{err("faktor")}
									</CardContent>
								</Card>
							</div>
						</section>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FontAwesomeIcon icon={faBullseye} className="size-4" />
									C. Tujuan Proyek
								</CardTitle>
								<CardDescription className="text-base">
									Target kuantitatif dan jadwal operasi.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-3">
								<div>
									<Label htmlFor="target-pct" className="text-base">
										Target reduksi emisi
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id="target-pct"
											inputMode="decimal"
											value={targetPct}
											onChange={(ev) => setTargetPct(ev.target.value)}
											placeholder="45"
											aria-invalid={Boolean(errors.targetPct)}
											aria-describedby="target-pct-helper"
											className="mt-1 h-10 text-base tabular-nums"
										/>
										<span
											aria-hidden="true"
											className="mt-1 shrink-0 text-base text-muted-foreground"
										>
											%
										</span>
									</div>
									<p
										id="target-pct-helper"
										className="mt-1 text-base text-muted-foreground"
									></p>
									{err("targetPct")}
								</div>
								<div>
									<Label htmlFor="target-mwh" className="text-base">
										Target energi bersih
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id="target-mwh"
											inputMode="decimal"
											value={targetMwh}
											onChange={(ev) => setTargetMwh(ev.target.value)}
											placeholder="8.000"
											aria-invalid={Boolean(errors.targetMwh)}
											className="mt-1 h-10 text-base tabular-nums"
										/>
										<span
											aria-hidden="true"
											className="mt-1 shrink-0 text-base text-muted-foreground"
										>
											MWh/tahun
										</span>
									</div>
									{err("targetMwh")}
								</div>
								<div>
									<Label htmlFor="timeline" className="text-base">
										Awal operasi komersial
									</Label>
									<div className="relative mt-1">
										<FontAwesomeIcon
											icon={faCalendarDays}
											className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<select
											id="timeline"
											value={timeline}
											onChange={(ev) => setTimeline(ev.target.value)}
											aria-invalid={Boolean(errors.timeline)}
											className="h-10 w-full appearance-auto rounded-md border border-input bg-input/20 pl-9 pr-8 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive"
										>
											{buildQuarterOptions().map((opt) => (
												<option key={opt} value={opt}>
													{opt}
												</option>
											))}
										</select>
									</div>
									{err("timeline")}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FontAwesomeIcon icon={faPenToSquare} className="size-4" />
									D. Gambaran Singkat Proyek
								</CardTitle>
								<CardDescription className="text-base">
									{ringkasan.trim().length}/1000 karakter · minimal 50.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Label htmlFor="ringkasan" className="sr-only">
									Gambaran singkat proyek
								</Label>
								<textarea
									id="ringkasan"
									value={ringkasan}
									onChange={(ev) => setRingkasan(ev.target.value)}
									placeholder="Ceritakan kondisi saat ini, teknologi yang diusulkan, dan hasil yang diharapkan…"
									rows={5}
									maxLength={1000}
									aria-invalid={Boolean(errors.ringkasan)}
									className="w-full rounded-md border border-input bg-input/20 px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive"
								/>
								{err("ringkasan")}
							</CardContent>
						</Card>
					</div>

					<aside className="min-w-0 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">
									Ringkasan Target Reduksi Emisi
								</CardTitle>
							</CardHeader>
							<CardContent className="grid items-center gap-4">
								<div className="relative mx-auto h-[200px] w-[200px]">
									<PieChart
										data={[
											{ label: "Tercapai", value: donutPct, color: "#00712D" },
											{
												label: "Sisa",
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
										<p className="text-3xl font-semibold leading-none tabular-nums">
											{formatId(donutPct, donutPct % 1 === 0 ? 0 : 1)}%
										</p>
										<p className="mt-2 text-base text-muted-foreground">
											{targetValid ? "target proyek" : "contoh mock"}
										</p>
									</div>
								</div>
								<dl className="space-y-2">
									<div className="flex items-center justify-between gap-4">
										<dt className="text-base text-muted-foreground">
											Baseline
										</dt>
										<dd className="text-base font-semibold tabular-nums">
											{baseline !== null
												? `${formatId(baseline, 1)} tCO₂`
												: "—"}
										</dd>
									</div>
									<div className="flex items-center justify-between gap-4">
										<dt className="text-base text-muted-foreground">
											Pengurangan
										</dt>
										<dd className="text-base font-semibold tabular-nums">
											{pengurangan !== null
												? `${formatId(pengurangan, 1)} tCO₂`
												: "—"}
										</dd>
									</div>
									<div className="flex items-center justify-between gap-4">
										<dt className="text-base text-muted-foreground">Target</dt>
										<dd className="text-base font-semibold tabular-nums">
											{baseline !== null && pengurangan !== null
												? `${formatId(baseline - pengurangan, 1)} tCO₂`
												: "—"}
										</dd>
									</div>
								</dl>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Preview Risiko</CardTitle>
								<CardDescription className="text-base">
									Otomatis dari input kiri.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid grid-cols-3 gap-2 text-center">
								{(
									[
										{ label: "Finansial", tone: riskFinansial, icon: faCoins },
										{
											label: "Teknis",
											tone: riskTeknis,
											icon: faScrewdriverWrench,
										},
										{
											label: "Implementasi",
											tone: riskImplementasi,
											icon: faGaugeHigh,
										},
									] as const
								).map((r) => (
									<div
										key={r.label}
										className="rounded-md border border-border p-2"
									>
										<FontAwesomeIcon
											icon={r.icon}
											className="mx-auto size-4 text-muted-foreground"
										/>
										<p className="mt-1 text-base font-medium">{r.label}</p>
										<Badge variant={riskVariant(r.tone)} className="mt-1">
											{r.tone}
										</Badge>
									</div>
								))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">
									Dokumen yang Disiapkan
								</CardTitle>
								<CardDescription className="text-base">
									{docsDone}/{REQUIRED_DOCS.length} terunggah · tersimpan lokal.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{REQUIRED_DOCS.map((doc) => {
									const name = uploaded[doc.id];
									return (
										<div
											key={doc.id}
											className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
										>
											<div className="flex min-w-0 items-center gap-3">
												<FontAwesomeIcon
													icon={doc.icon}
													className="size-4 shrink-0 text-muted-foreground"
												/>
												<div className="min-w-0">
													<p className="truncate text-base font-medium">
														{doc.label}
													</p>
													<p className="truncate text-base text-muted-foreground">
														{name ?? "Belum ada file"}
													</p>
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												<Badge variant={name ? "default" : "outline"}>
													{name ? "Sudah" : "Belum"}
												</Badge>
												<input
													ref={(el) => {
														fileRefs.current[doc.id] = el;
													}}
													type="file"
													className="sr-only"
													aria-label={`Unggah ${doc.label}`}
													onChange={(ev) =>
														handleFile(doc.id, ev.target.files?.[0])
													}
												/>
												{name ? (
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														aria-label={`Hapus ${doc.label}`}
														onClick={() =>
															setUploaded((prev) => {
																const next = { ...prev };
																delete next[doc.id];
																return next;
															})
														}
													>
														<FontAwesomeIcon icon={faTrash} />
													</Button>
												) : (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => fileRefs.current[doc.id]?.click()}
													>
														<FontAwesomeIcon icon={faCloudArrowUp} />
														Unggah
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</CardContent>
						</Card>
					</aside>
				</div>
			)}

			{activeStep === 1 && (
				<Step2View
					capex={capex}
					tenor={tenor}
					saving={saving}
					pendapatan={pendapatan}
					jaminan={jaminan}
					onCapex={setCapex}
					onTenor={setTenor}
					onSaving={setSaving}
					onPendapatan={setPendapatan}
					onJaminan={setJaminan}
					files={finFiles}
					onFiles={handleFinFiles}
					onRemoveFile={(i: number) =>
						setFinFiles((prev) => prev.filter((_, j) => j !== i))
					}
					errors={step2Errors}
					score={score}
				/>
			)}

			{activeStep === 2 && (
				<Step3View
					docs={step3Docs}
					onUpload={handleStep3Upload}
					onRemove={handleStep3Remove}
				/>
			)}

			{activeStep === 3 && (
				<Step4View
					step1={{ namaProyek, lokasi, sektor }}
					step2={{ capex, tenor, saving, pendapatan, jaminan }}
					step1Docs={REQUIRED_DOCS.map((d) => ({
						id: d.id,
						label: d.label,
						name: uploaded[d.id],
					}))}
					step3Docs={step3Docs}
					risk={riskAssessment}
					consent={consent}
					declaration={declaration}
					onConsent={setConsent}
					onDeclaration={setDeclaration}
					onSubmit={() => {
						markValid(3);
						setSubmitted(true);
					}}
					submitted={submitted}
				/>
			)}

			<div className="flex items-center justify-between gap-3">
				<Button
					type="button"
					variant="secondary"
					disabled={activeStep === 0}
					onClick={handleBack}
				>
					<FontAwesomeIcon icon={faArrowLeft} />
					Kembali
				</Button>
				{activeStep < 3 && (
					<Button type="button" size="lg" onClick={handleNext}>
						Simpan &amp; Lanjut
						<FontAwesomeIcon icon={faArrowRight} />
					</Button>
				)}
			</div>
		</div>
	);
}
