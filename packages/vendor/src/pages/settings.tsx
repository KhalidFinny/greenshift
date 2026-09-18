import { Tabs, TabsContent, TabsList, TabsTrigger } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { CertificationsCard } from "../organisms/certifications-card";
import { CompanyProfileForm } from "../organisms/company-profile-form";
import { DocumentsVaultCard } from "../organisms/documents-vault-card";
import { SecurityCard } from "../organisms/security-card";
import { VerificationStatusCard } from "../organisms/verification-status-card";

export function VendorSettingsPage() {
	const { verification, uploadVerificationDocs, profile, saveProfile } =
		useVendorData();

	return (
		<div className="space-y-6">
			<Tabs defaultValue="verification">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="verification">Verifikasi</TabsTrigger>
					<TabsTrigger value="profile">Profil</TabsTrigger>
					<TabsTrigger value="certifications">Sertifikasi</TabsTrigger>
					<TabsTrigger value="documents">Dokumen</TabsTrigger>
					<TabsTrigger value="security">Keamanan</TabsTrigger>
				</TabsList>

				{/* Verification Tab */}
				<TabsContent value="verification" className="mt-6">
					<VerificationStatusCard
						verification={verification}
						onUpload={uploadVerificationDocs}
					/>
				</TabsContent>

				{/* Company Profile Tab */}
				<TabsContent value="profile" className="mt-6">
					<CompanyProfileForm
						companyName={profile?.companyName}
						description={profile?.description ?? undefined}
						onSave={saveProfile}
					/>
				</TabsContent>

				{/* Certifications Tab */}
				<TabsContent value="certifications" className="mt-6">
					<CertificationsCard
						certifications={verification.certifications}
						verified={verification.status === "VERIFIED"}
					/>
				</TabsContent>

				{/* Documents Tab */}
				<TabsContent value="documents" className="mt-6">
					<DocumentsVaultCard />
				</TabsContent>

				{/* Security Tab */}
				<TabsContent value="security" className="mt-6">
					<SecurityCard />
				</TabsContent>
			</Tabs>
		</div>
	);
}
