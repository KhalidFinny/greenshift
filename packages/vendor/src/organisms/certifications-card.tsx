import { Badge, Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";

interface CertificationItem {
	name: string;
	issuer: string;
	isVerified?: boolean;
}

const DEFAULT_CERTS: CertificationItem[] = [
	{
		name: "Sertifikat ESCO Kelas Utama",
		issuer: "Kementerian ESDM • Berlaku hingga 2028",
		isVerified: true,
	},
	{
		name: "ISO 50001:2018 Energy Management",
		issuer: "Sistem Manajemen Energi Industri",
		isVerified: true,
	},
];

export function CertificationsCard({
	certifications = DEFAULT_CERTS,
}: {
	certifications?: CertificationItem[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Sertifikasi Industri (ESCO & ISO)</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				{certifications.map((cert) => (
					<div
						key={cert.name}
						className="flex items-center justify-between rounded-lg border border-border p-3"
					>
						<div>
							<h4 className="text-sm font-bold">{cert.name}</h4>
							<p className="text-muted-foreground">{cert.issuer}</p>
						</div>
						{cert.isVerified && (
							<Badge className="bg-emerald-600 text-white">Terverifikasi</Badge>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
