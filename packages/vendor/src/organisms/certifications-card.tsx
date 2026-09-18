import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";

export function CertificationsCard({
	certifications = [],
	verified = false,
}: {
	certifications?: string[];
	verified?: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Sertifikasi Industri (ESCO & ISO)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				{certifications.length === 0 && (
					<p className="text-muted-foreground">
						Belum ada sertifikasi yang tercatat pada profil perusahaan.
					</p>
				)}
				{certifications.map((cert) => (
					<div
						key={cert}
						className="flex items-center justify-between rounded-lg border border-border p-3"
					>
						<div>
							<h4 className="text-sm font-bold">{cert}</h4>
						</div>
						{verified && (
							<Badge className="bg-emerald-600 text-white">Terverifikasi</Badge>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
