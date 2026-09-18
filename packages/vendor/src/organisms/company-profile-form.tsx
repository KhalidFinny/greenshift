import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@greenshift/ui";
import { useEffect, useState } from "react";

interface CompanyProfileFormProps {
	companyName?: string;
	description?: string;
	onSave: (data: { companyName: string; description: string }) => void;
}

/**
 * Company profile form. Only the fields the API stores (`company_name`,
 * `description` on the vendor profile) are editable.
 */
export function CompanyProfileForm({
	companyName: initialCompanyName,
	description: initialDescription,
	onSave,
}: CompanyProfileFormProps) {
	const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
	const [description, setDescription] = useState(initialDescription ?? "");

	// The profile arrives asynchronously; adopt it once it lands.
	useEffect(() => {
		if (initialCompanyName !== undefined) setCompanyName(initialCompanyName);
	}, [initialCompanyName]);
	useEffect(() => {
		if (initialDescription !== undefined) setDescription(initialDescription);
	}, [initialDescription]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSave({ companyName, description });
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

					<Button type="submit" size="sm" className="gap-2">
						Simpan Profil
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
