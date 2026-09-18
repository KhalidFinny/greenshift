import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@greenshift/ui";
import { useState } from "react";

interface CompanyProfileFormProps {
	onSave: (data: {
		companyName: string;
		description: string;
		contactEmail: string;
		contactPhone: string;
		website: string;
	}) => void;
}

export function CompanyProfileForm({ onSave }: CompanyProfileFormProps) {
	const [companyName, setCompanyName] = useState("PT Nusantara Energy Solution");
	const [description, setDescription] = useState(
		"Perusahaan EPC & ESCO spesialis pengadaan sistem Solar PV industri, Retrofit HVAC sentral, dan manajemen efisiensi energi gedung terverifikasi ISO 50001.",
	);
	const [contactEmail, setContactEmail] = useState("vendor1@greenshift.dev");
	const [contactPhone, setContactPhone] = useState("+62 812-3456-7890");
	const [website, setWebsite] = useState("https://nusantaraenergy.co.id");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSave({ companyName, description, contactEmail, contactPhone, website });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Informasi Profil Perusahaan</CardTitle>
			</CardHeader>
			<CardContent className="text-xs">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="cp-name" className="text-xs font-semibold">
							Nama Perusahaan:
						</Label>
						<Input
							id="cp-name"
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="cp-desc" className="text-xs font-semibold">
							Deskripsi Profil Perusahaan:
						</Label>
						<textarea
							id="cp-desc"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="space-y-1.5">
							<Label htmlFor="cp-email" className="text-xs font-semibold">
								Email Kontak:
							</Label>
							<Input
								id="cp-email"
								type="email"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="cp-phone" className="text-xs font-semibold">
								Telepon Kantor:
							</Label>
							<Input
								id="cp-phone"
								value={contactPhone}
								onChange={(e) => setContactPhone(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="cp-web" className="text-xs font-semibold">
								Website Perusahaan:
							</Label>
							<Input
								id="cp-web"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
							/>
						</div>
					</div>

					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							className="bg-[#03442C] text-white hover:bg-[#03442C]/90"
						>
							Simpan Perubahan Profil
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
