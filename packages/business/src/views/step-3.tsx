import {
	faCircleQuestion,
	faCloudArrowUp,
	faFileLines,
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
} from "@greenshift/ui";
import { useRef } from "react";

export interface Step3Doc {
	id: string;
	title: string;
	desc: string;
}

export interface Step3Section {
	title: string;
	items: Step3Doc[];
}

export const STEP3_SECTIONS: Step3Section[] = [
	{
		title: "Legalitas Entitas",
		items: [
			{
				id: "akta",
				title: "Akta Perusahaan",
				desc: "Akta pendirian dan perubahan terakhir.",
			},
			{
				id: "nib",
				title: "NIB & NPWP",
				desc: "Nomor Induk Berusaha dan NPWP perusahaan.",
			},
			{
				id: "profil",
				title: "Profil Perusahaan",
				desc: "Profil singkat kegiatan usaha.",
			},
		],
	},
	{
		title: "Dokumen Teknis & Mitigasi Emisi",
		items: [
			{
				id: "studi",
				title: "Studi Kelayakan",
				desc: "Kajian teknis dan finansial proyek.",
			},
			{
				id: "dram",
				title: "DRAM",
				desc: "Rencana aksi mitigasi emisi gas rumah kaca.",
			},
			{
				id: "spek",
				title: "Spesifikasi Teknis",
				desc: "Spesifikasi peralatan yang digunakan.",
			},
		],
	},
];

export const STEP3_TOTAL = STEP3_SECTIONS.reduce(
	(n, s) => n + s.items.length,
	0,
);

export interface Step3ViewProps {
	docs: Record<string, string>;
	onUpload: (id: string, file: File | undefined) => void;
	onRemove: (id: string) => void;
}

export function Step3View({ docs, onUpload, onRemove }: Step3ViewProps) {
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const done = STEP3_SECTIONS.flatMap((s) => s.items).filter(
		(d) => docs[d.id],
	).length;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-6">
				{STEP3_SECTIONS.map((section, si) => (
					<Card key={section.title}>
						<CardHeader>
							<CardTitle className="text-lg">
								{si === 0 ? "A" : "B"}. {section.title}
							</CardTitle>
							<CardDescription className="text-base">
								Unggah berkas pendukung, tersimpan lokal.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{section.items.map((doc) => {
								const name = docs[doc.id];
								return (
									<div
										key={doc.id}
										className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
									>
										<div className="flex min-w-0 items-center gap-3">
											<FontAwesomeIcon
												icon={faFileLines}
												className="size-4 shrink-0 text-muted-foreground"
											/>
											<div className="min-w-0">
												<p className="truncate text-base font-medium">
													{doc.title}
												</p>
												<p className="truncate text-base text-muted-foreground">
													{name ?? doc.desc}
												</p>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<input
												ref={(el) => {
													fileRefs.current[doc.id] = el;
												}}
												type="file"
												className="sr-only"
												aria-label={`Unggah ${doc.title}`}
												onChange={(ev) =>
													onUpload(doc.id, ev.target.files?.[0])
												}
											/>
											{name ? (
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													aria-label={`Hapus ${doc.title}`}
													onClick={() => onRemove(doc.id)}
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
				))}
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Status Kelengkapan</CardTitle>
						<CardDescription className="text-base">
							{done} / {STEP3_TOTAL} Dokumen Terunggah
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							role="progressbar"
							aria-valuenow={done}
							aria-valuemin={0}
							aria-valuemax={STEP3_TOTAL}
							aria-label="Kelengkapan dokumen"
							className="h-2 overflow-hidden rounded-full bg-muted"
						>
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${(done / STEP3_TOTAL) * 100}%` }}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-start gap-3 pt-6">
						<FontAwesomeIcon
							icon={faCircleQuestion}
							className="mt-1 size-5 shrink-0"
						/>
						<div>
							<p className="text-base font-semibold">Panduan LVV GRK</p>
							<p className="mt-1 text-base text-muted-foreground">
								Dokumen teknis akan divalidasi Lembaga Validasi/Verifikasi gas
								rumah kaca. Pastikan DRAM konsisten dengan target reduksi emisi.
							</p>
						</div>
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
