import {
	faCheckCircle,
	faLock,
	faShieldAlt,
	faSpinner,
	faUpload,
	faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@greenshift/ui";
import { useState } from "react";
import type { CompanyVerificationDetails } from "../lib/types";
import { formatDate } from "../lib/format";

interface VerificationStatusCardProps {
	verification: CompanyVerificationDetails;
	onUpload: (
		nib: string,
		npwp: string,
		legalDocName: string,
		escoCertName: string,
	) => void;
}

export function VerificationStatusCard({
	verification,
	onUpload,
}: VerificationStatusCardProps) {
	const [nib, setNib] = useState(verification.nib ?? "9120405821034");
	const [npwp, setNpwp] = useState(verification.npwp ?? "01.345.678.9-012.000");
	const [legalDoc, setLegalDoc] = useState("SIUP_Nusantara.pdf");
	const [escoCert, setEscoCert] = useState("ESCO_Class_A.pdf");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onUpload(nib, npwp, legalDoc, escoCert);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faShieldAlt} className="text-emerald-600" />
							Status Verifikasi Dokumen Otomatis
						</span>
						{verification.status === "VERIFIED" && (
							<Badge className="gap-1 bg-emerald-600 font-bold text-white">
								<FontAwesomeIcon icon={faCheckCircle} /> Terverifikasi Otomatis
							</Badge>
						)}
						{verification.status === "VERIFYING" && (
							<Badge className="gap-1 bg-blue-600 font-bold text-white">
								<FontAwesomeIcon icon={faSpinner} className="animate-spin" />{" "}
								Memeriksa Dokumen...
							</Badge>
						)}
						{verification.status === "NOT_VERIFIED" && (
							<Badge className="bg-amber-600 font-bold text-white">
								Belum Terverifikasi
							</Badge>
						)}
						{verification.status === "REJECTED" && (
							<Badge className="bg-red-600 font-bold text-white">
								Ditolak - Perlu Perbaikan
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-xs">
					<p className="text-muted-foreground">
						Verifikasi Vendor GreenShift berjalan secara otomatis menggunakan
						sistem ekstraksi dokumen cerdas. Tidak memerlukan persetujuan manual
						Admin.
					</p>

					{verification.status === "VERIFIED" && (
						<div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
							<div className="flex items-center gap-2 text-sm font-bold">
								<FontAwesomeIcon icon={faUserCheck} className="text-emerald-600" />
								Perusahaan Anda Telah Terverifikasi Penuh
							</div>
							<p>
								Seluruh dokumen legalitas NIB, NPWP, dan Sertifikat ESCO telah
								divalidasi secara sukses pada{" "}
								<span className="font-semibold">
									{formatDate(verification.verifiedAt)}
								</span>
								.
							</p>
							<p className="pt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
								✓ Berhak mengikuti Lelang Terbuka, Lelang Tertutup, Penunjukan
								Langsung, dan Pengajuan Proposal.
							</p>
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="space-y-4 border-t border-border pt-4"
					>
						<h4 className="text-sm font-bold text-foreground">
							Dokumen Verifikasi Legalitas & Industri
						</h4>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="v-nib" className="text-xs font-semibold">
									Nomor Induk Berusaha (NIB):
								</Label>
								<Input
									id="v-nib"
									value={nib}
									onChange={(e) => setNib(e.target.value)}
									placeholder="Masukkan 13 digit NIB..."
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="v-npwp" className="text-xs font-semibold">
									Nomor Pokok Wajib Pajak (NPWP):
								</Label>
								<Input
									id="v-npwp"
									value={npwp}
									onChange={(e) => setNpwp(e.target.value)}
									placeholder="Masukkan NPWP Perusahaan..."
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="v-legaldoc" className="text-xs font-semibold">
									Dokumen Legalitas Utama (PDF/SIUP):
								</Label>
								<Input
									id="v-legaldoc"
									value={legalDoc}
									onChange={(e) => setLegalDoc(e.target.value)}
									placeholder="SIUP_Nusantara.pdf"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="v-esco" className="text-xs font-semibold">
									Sertifikat ESCO / Lisensi Industri:
								</Label>
								<Input
									id="v-esco"
									value={escoCert}
									onChange={(e) => setEscoCert(e.target.value)}
									placeholder="ESCO_Class_A.pdf"
								/>
							</div>
						</div>

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								className="gap-2 bg-[#03442C] text-white hover:bg-[#03442C]/90"
							>
								<FontAwesomeIcon icon={faUpload} />
								Jalankan Verifikasi Otomatis
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<FontAwesomeIcon icon={faLock} className="text-amber-600" />
						Aturan Batasan Hak Akses Vendor (Vendor Boundaries)
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs text-muted-foreground">
					<p>
						Sesuai spesifikasi VENDORROLE.md, akun Vendor mematuhi batasan peran
						berikut:
					</p>
					<ul className="list-disc space-y-1 pl-5">
						<li>
							Vendor <strong className="text-foreground">tidak dapat</strong>{" "}
							mengedit data proyek milik Klien atau Penilaian Risiko Proyek.
						</li>
						<li>
							Vendor <strong className="text-foreground">tidak dapat</strong>{" "}
							mengakses keuangan investor atau informasi penawaran pesaing yang
							bersifat privat.
						</li>
						<li>
							Vendor <strong className="text-foreground">tidak dapat</strong>{" "}
							mengedit skor kecocokan matchmaking atau skor kinerja yang
							dihasilkan sistem secara otomatis.
						</li>
						<li>
							Vendor <strong className="text-foreground">tidak dapat</strong>{" "}
							mengosongkan atau menyetujui milestone diri sendiri (persetujuan
							dari Klien).
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
