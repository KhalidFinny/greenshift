import {
	faBuilding,
	faCloudArrowUp,
	faCoins,
	faFileLines,
	faGaugeHigh,
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
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { useRef } from "react";
import type { CreditScoreResult } from "../lib/credit-score";

export const JAMINAN_OPTIONS = [
	"Sertifikat Tanah/Bangunan",
	"Mesin & Peralatan",
	"Piutang Usaha",
	"Jaminan Korporasi / Letter of Comfort",
] as const;

export interface Step2ViewProps {
	capex: string;
	tenor: string;
	saving: string;
	pendapatan: string;
	jaminan: string;
	onCapex: (v: string) => void;
	onTenor: (v: string) => void;
	onSaving: (v: string) => void;
	onPendapatan: (v: string) => void;
	onJaminan: (v: string) => void;
	files: string[];
	onFiles: (files: FileList | null) => void;
	onRemoveFile: (index: number) => void;
	errors: Record<string, string>;
	score: CreditScoreResult;
}

export function Step2View(props: Step2ViewProps) {
	const {
		capex,
		tenor,
		saving,
		pendapatan,
		jaminan,
		onCapex,
		onTenor,
		onSaving,
		onPendapatan,
		onJaminan,
		files,
		onFiles,
		onRemoveFile,
		errors,
		score,
	} = props;
	const fileRef = useRef<HTMLInputElement | null>(null);

	const err = (key: string) =>
		errors[key] ? (
			<p role="alert" className="mt-1 text-base text-destructive">
				{errors[key]}
			</p>
		) : null;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<FontAwesomeIcon icon={faCoins} className="size-4" />
							A. Kebutuhan Pendanaan Proyek
						</CardTitle>
						<CardDescription className="text-base">
							Total belanja modal, tenor, dan estimasi penghematan tahunan.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-3">
						<div>
							<Label htmlFor="capex" className="text-base">
								Total CAPEX
							</Label>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="mt-1 shrink-0 text-base text-muted-foreground"
								>
									Rp
								</span>
								<Input
									id="capex"
									inputMode="decimal"
									value={capex}
									onChange={(ev) => onCapex(ev.target.value)}
									placeholder="4.200.000.000"
									aria-invalid={Boolean(errors.capex)}
									className="mt-1 h-10 text-base tabular-nums"
								/>
							</div>
							{err("capex")}
						</div>
						<div>
							<Label htmlFor="tenor" className="text-base">
								Tenor Pembiayaan
							</Label>
							<div className="flex items-center gap-2">
								<Input
									id="tenor"
									inputMode="numeric"
									value={tenor}
									onChange={(ev) => onTenor(ev.target.value)}
									placeholder="10"
									aria-invalid={Boolean(errors.tenor)}
									className="mt-1 h-10 text-base tabular-nums"
								/>
								<span
									aria-hidden="true"
									className="mt-1 shrink-0 text-base text-muted-foreground"
								>
									Tahun
								</span>
							</div>
							{err("tenor")}
						</div>
						<div>
							<Label htmlFor="saving" className="text-base">
								Estimasi Penghematan Tahunan
							</Label>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="mt-1 shrink-0 text-base text-muted-foreground"
								>
									Rp
								</span>
								<Input
									id="saving"
									inputMode="decimal"
									value={saving}
									onChange={(ev) => onSaving(ev.target.value)}
									placeholder="500.000.000"
									aria-invalid={Boolean(errors.saving)}
									className="mt-1 h-10 text-base tabular-nums"
								/>
							</div>
							{err("saving")}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<FontAwesomeIcon icon={faBuilding} className="size-4" />
							B. Profil Keuangan Singkat
						</CardTitle>
						<CardDescription className="text-base">
							Kapasitas pembayaran dan bentuk jaminan perusahaan.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="pendapatan" className="text-base">
								Pendapatan Tahunan Perusahaan
							</Label>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="mt-1 shrink-0 text-base text-muted-foreground"
								>
									Rp
								</span>
								<Input
									id="pendapatan"
									inputMode="decimal"
									value={pendapatan}
									onChange={(ev) => onPendapatan(ev.target.value)}
									placeholder="10.000.000.000"
									aria-invalid={Boolean(errors.pendapatan)}
									className="mt-1 h-10 text-base tabular-nums"
								/>
							</div>
							{err("pendapatan")}
						</div>
						<div>
							<Label htmlFor="jaminan" className="text-base">
								Bentuk Jaminan
							</Label>
							<Select value={jaminan} onValueChange={onJaminan}>
								<SelectTrigger id="jaminan" className="mt-1 w-full">
									<SelectValue placeholder="Pilih jaminan" />
								</SelectTrigger>
								<SelectContent>
									{JAMINAN_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{err("jaminan")}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<FontAwesomeIcon icon={faCloudArrowUp} className="size-4" />
							C. Dokumen Finansial
						</CardTitle>
						<CardDescription className="text-base">
							Laporan Keuangan + RAB. Minimal 1 file, tersimpan lokal.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
							<FontAwesomeIcon
								icon={faCloudArrowUp}
								className="mx-auto size-5 text-muted-foreground"
							/>
							<p className="mt-2 text-base font-medium">
								Unggah Laporan Keuangan dan RAB
							</p>
							<p className="mt-1 text-base text-muted-foreground">
								{files.length} file terunggah · tersimpan lokal.
							</p>
							<input
								ref={fileRef}
								type="file"
								multiple
								className="sr-only"
								aria-label="Unggah laporan keuangan dan RAB"
								onChange={(ev) => onFiles(ev.target.files)}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-3"
								onClick={() => fileRef.current?.click()}
							>
								<FontAwesomeIcon icon={faCloudArrowUp} />
								Pilih file
							</Button>
						</div>
						{files.map((name, i) => (
							<div
								key={`${name}-${i}`}
								className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<FontAwesomeIcon
										icon={faFileLines}
										className="size-4 shrink-0 text-muted-foreground"
									/>
									<p className="truncate text-base font-medium">{name}</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Hapus ${name}`}
									onClick={() => onRemoveFile(i)}
								>
									<FontAwesomeIcon icon={faTrash} />
								</Button>
							</div>
						))}
						{err("files")}
					</CardContent>
				</Card>
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<FontAwesomeIcon icon={faGaugeHigh} className="size-4" />
							Simulasi Credit Scoring
						</CardTitle>
						<CardDescription className="text-base">
							Otomatis dari input kiri.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{score.score === null || score.rating === null ? (
							<p className="rounded-md bg-muted px-4 py-3 text-base text-muted-foreground">
								Belum dihitung — lengkapi CAPEX, tenor, dan penghematan.
							</p>
						) : (
							<div className="rounded-md bg-muted px-4 py-3">
								<p className="text-3xl font-semibold tabular-nums">
									{score.rating}
								</p>
								<div
									role="progressbar"
									aria-valuenow={score.score}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Skor kredit"
									className="mt-3 h-2 overflow-hidden rounded-full bg-background"
								>
									<div
										className="h-full rounded-full bg-primary"
										style={{ width: `${score.score}%` }}
									/>
								</div>
								<p className="mt-2 text-base tabular-nums text-muted-foreground">
									Skor {score.score}/100
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
