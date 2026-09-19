import {
	faCircleCheck,
	faEye,
	faFileLines,
	faPaperPlane,
	faTriangleExclamation,
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	PieChart,
	PieSlice,
} from "@greenshift/ui";
import { useState } from "react";
import type { ProjectRiskResult } from "../lib/project-risk";
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
	step1: Step1Summary;
	step2: Step2Summary;
	step1Docs: { id: string; label: string; name?: string }[];
	step3Docs: Record<string, string>;
	risk: ProjectRiskResult | null;
	consent: boolean;
	declaration: boolean;
	onConsent: (v: boolean) => void;
	onDeclaration: (v: boolean) => void;
	onSubmit: () => void;
	submitted: boolean;
}

type ToneVariant = "default" | "secondary" | "destructive" | "outline";

function toneVariant(tone: "Rendah" | "Sedang" | "Tinggi" | null): ToneVariant {
	switch (tone) {
		case "Rendah":
			return "default";
		case "Sedang":
			return "secondary";
		case "Tinggi":
			return "destructive";
		default:
			return "outline";
	}
}
export function RiskAssessmentBody({
	risk,
}: {
	risk: ProjectRiskResult | null;
}) {
	if (risk === null) {
		return (
			<p className="rounded-md bg-muted px-4 py-3 text-base text-muted-foreground">
				Belum dihitung — lengkapi Langkah 1–3.
			</p>
		);
	}
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-md bg-muted px-4 py-3">
					<div className="relative mx-auto h-[160px] w-[160px]">
						<PieChart
							data={[
								{
									label: "Risiko",
									value: risk.score,
									/* data-ink exception: orange risk share slice */
									color: "#f97316",
								},
								{
									label: "Sisa",
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
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
							<p className="text-2xl font-semibold leading-none tabular-nums">
								{risk.score}/100
							</p>
							<Badge
								variant={
									risk.level === "Rendah"
										? "default"
										: risk.level === "Moderat"
											? "secondary"
											: "destructive"
								}
								className="mt-2"
							>
								{risk.level}
							</Badge>
						</div>
					</div>
					<p className="mt-2 text-center text-base text-muted-foreground">
						Skor risiko proyek
					</p>
				</div>
				<div className="flex flex-col justify-center rounded-md bg-muted px-4 py-3">
					<p className="text-3xl font-semibold leading-none tabular-nums">
						{risk.success}%
					</p>
					<p className="mt-2 text-base text-muted-foreground">
						Probabilitas keberhasilan
					</p>
					<svg
						viewBox="0 0 120 32"
						className="mt-3 h-8 w-full"
						role="img"
						aria-label="Tren risiko per area"
					>
						<polyline
							/* data-ink exception: green success-trend stroke */
							stroke="#16a34a"
							strokeWidth={2}
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							points={risk.breakdown
								.map(
									(b, i) => `${i * 40},${(30 - (b.pct / 100) * 26).toFixed(1)}`,
								)
								.join(" ")}
						/>
					</svg>
				</div>
			</div>
			<div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
				<div className="space-y-3 rounded-md bg-card px-4 py-3">
					{risk.breakdown.map((row) => (
						<div key={row.key} className="space-y-1">
							<div className="flex items-center justify-between gap-3">
								<p className="text-base font-medium">{row.label}</p>
								<Badge variant={toneVariant(row.tone)}>
									{row.tone ?? "Belum diisi"}
								</Badge>
							</div>
							<div
								role="progressbar"
								aria-valuenow={row.pct}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={`Risiko ${row.label}`}
								className="h-2 rounded-full bg-muted"
							>
								<div
									className="h-2 rounded-full bg-primary"
									style={{ width: `${row.pct}%` }}
								/>
							</div>
						</div>
					))}
				</div>
				<div className="rounded-md bg-card px-4 py-3">
					<p className="text-base font-semibold">Faktor Risiko Utama</p>
					{risk.factors.length === 0 ? (
						<p className="mt-2 text-base text-muted-foreground">
							Tidak ada faktor risiko utama.
						</p>
					) : (
						<ul className="mt-2 space-y-2">
							{risk.factors.map((factor) => (
								<li key={factor} className="flex items-start gap-2 text-base">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 size-4 shrink-0 text-muted-foreground"
									/>
									{factor}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-md bg-card px-4 py-3">
					<p className="text-base font-semibold">Mitigasi</p>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-base">
						{risk.mitigations.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
				<div className="rounded-md bg-muted px-4 py-3">
					<p className="text-base font-semibold">Ringkasan Risiko</p>
					<p className="mt-2 text-base">{risk.summary}</p>
				</div>
			</div>
		</div>
	);
}

export function Step4View(props: Step4ViewProps) {
	const {
		step1,
		step2,
		step1Docs,
		step3Docs,
		risk,
		consent,
		declaration,
		onConsent,
		onDeclaration,
		onSubmit,
		submitted,
	} = props;
	const canSubmit = consent && declaration;
	const step3Items = STEP3_SECTIONS.flatMap((s) => s.items);
	const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							A. Ringkasan Proyek &amp; Finansial
						</CardTitle>
						<CardDescription className="text-base">
							Ringkasan baca-saja dari Langkah 1 dan 2.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-md bg-muted px-4 py-3">
							<p className="text-base font-semibold">Langkah 1 — Profil</p>
							<dl className="mt-2 space-y-1">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">Proyek</dt>
									<dd className="text-base font-medium">
										{step1.namaProyek || "—"}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">Lokasi</dt>
									<dd className="text-base font-medium">
										{step1.lokasi || "—"}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">Sektor</dt>
									<dd className="text-base font-medium">
										{step1.sektor || "—"}
									</dd>
								</div>
							</dl>
						</div>
						<div className="rounded-md bg-muted px-4 py-3">
							<p className="text-base font-semibold">Langkah 2 — Finansial</p>
							<dl className="mt-2 space-y-1">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">CAPEX</dt>
									<dd className="text-base font-medium tabular-nums">
										{step2.capex ? `Rp ${step2.capex}` : "—"}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">Tenor</dt>
									<dd className="text-base font-medium tabular-nums">
										{step2.tenor ? `${step2.tenor} tahun` : "—"}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-base text-muted-foreground">Jaminan</dt>
									<dd className="text-base font-medium">
										{step2.jaminan || "—"}
									</dd>
								</div>
							</dl>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">B. Status Dokumen</CardTitle>
						<CardDescription className="text-base">
							Centang hijau hanya untuk berkas yang sudah diunggah.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{step3Items.map((doc) => {
							const done = Boolean(step3Docs[doc.id]);
							return (
								<div
									key={doc.id}
									className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
								>
									<p className="truncate text-base">{doc.title}</p>
									{done ? (
										<FontAwesomeIcon
											icon={faCircleCheck}
											className="size-4 shrink-0 text-primary"
											aria-label={`${doc.title} sudah diunggah`}
										/>
									) : (
										<Badge variant="outline">Belum</Badge>
									)}
								</div>
							);
						})}
						{step1Docs.map((doc) => (
							<div
								key={doc.id}
								className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
							>
								<p className="truncate text-base">{doc.label}</p>
								{doc.name ? (
									<FontAwesomeIcon
										icon={faCircleCheck}
										className="size-4 shrink-0 text-primary"
										aria-label={`${doc.label} sudah diunggah`}
									/>
								) : (
									<Badge variant="outline">Belum</Badge>
								)}
							</div>
						))}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							B2. Penilaian Risiko Proyek
						</CardTitle>
						<CardDescription className="text-base">
							Ringkasan turunan dari Langkah 1–3. Buka detail lengkap.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{risk === null ? (
							<p className="rounded-md bg-muted px-4 py-3 text-base text-muted-foreground">
								Belum dihitung — lengkapi Langkah 1–3.
							</p>
						) : (
							<div className="flex items-center justify-between gap-4 rounded-md bg-muted px-4 py-3">
								<div className="flex items-center gap-3">
									<p className="text-2xl font-semibold leading-none tabular-nums">
										{risk.score}/100
									</p>
									<Badge
										variant={
											risk.level === "Rendah"
												? "default"
												: risk.level === "Moderat"
													? "secondary"
													: "destructive"
										}
									>
										{risk.level}
									</Badge>
								</div>
								<p className="text-base tabular-nums text-muted-foreground">
									{risk.success}% berhasil
								</p>
							</div>
						)}
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsRiskModalOpen(true)}
						>
							<FontAwesomeIcon icon={faEye} />
							Lihat Detail Penilaian Risiko
						</Button>
						<Dialog open={isRiskModalOpen} onOpenChange={setIsRiskModalOpen}>
							<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle className="text-lg">
										Penilaian Risiko Proyek
									</DialogTitle>
									<DialogDescription className="text-base">
										Skor turunan dari Langkah 1–3, bukan angka manual.
									</DialogDescription>
								</DialogHeader>
								<RiskAssessmentBody risk={risk} />
							</DialogContent>
						</Dialog>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							C. Deklarasi &amp; Verifikasi Manual
						</CardTitle>
						<CardDescription className="text-base">
							Kedua kotak wajib dicentang sebelum kirim.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<label className="flex items-start gap-3 text-base">
							<input
								type="checkbox"
								checked={consent}
								onChange={(ev) => onConsent(ev.target.checked)}
								className="mt-1 size-4 shrink-0 accent-primary"
							/>
							Saya menyetujui data proyek digunakan untuk penerbitan Green Bond.
						</label>
						<label className="flex items-start gap-3 text-base">
							<input
								type="checkbox"
								checked={declaration}
								onChange={(ev) => onDeclaration(ev.target.checked)}
								className="mt-1 size-4 shrink-0 accent-primary"
							/>
							Data yang saya isi benar dan dapat diverifikasi.
						</label>
					</CardContent>
				</Card>

				{submitted && (
					<output className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-3 text-base">
						<FontAwesomeIcon icon={faFileLines} className="size-4" />
						Pengajuan terkirim — tim kami akan menghubungi Anda.
					</output>
				)}
			</div>

			<aside className="min-w-0 space-y-6 xl:sticky xl:top-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Finalisasi Pengajuan</CardTitle>
						<CardDescription className="text-base">
							Periksa kembali sebelum mengirim.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							type="button"
							size="lg"
							className="w-full"
							disabled={!canSubmit}
							onClick={onSubmit}
						>
							<FontAwesomeIcon icon={faPaperPlane} />
							Kirim Pengajuan Proyek
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<p className="text-base font-semibold">Langkah Selanjutnya</p>
						<p className="mt-1 text-base text-muted-foreground">
							Review awal 3–5 hari kerja. Tim GreenShift menghubungi Anda untuk
							verifikasi lanjutan.
						</p>
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
