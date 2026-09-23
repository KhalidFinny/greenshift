import {
	faCertificate,
	faFolderOpen,
	faIdBadge,
	faLock,
	faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@greenshift/core";
import {
	AccountPhotoCard,
	Badge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { CertificationsCard } from "../organisms/certifications-card";
import { CompanyProfileForm } from "../organisms/company-profile-form";
import { DocumentsVaultCard } from "../organisms/documents-vault-card";
import { SecurityCard } from "../organisms/security-card";
import { VerificationStatusCard } from "../organisms/verification-status-card";

const SECTIONS = [
	{ value: "profile", icon: faIdBadge, label: "Profile" },
	{ value: "verification", icon: faUserCheck, label: "Verification" },
	{ value: "certifications", icon: faCertificate, label: "Certifications" },
	{ value: "documents", icon: faFolderOpen, label: "Documents" },
	{ value: "security", icon: faLock, label: "Security" },
] as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
	VERIFIED: { label: "Verified", className: "bg-emerald-700 text-white" },
	VERIFYING: { label: "Verifying", className: "bg-amber-700 text-white" },
	NOT_VERIFIED: {
		label: "Not verified",
		className: "bg-muted text-foreground",
	},
	REJECTED: { label: "Changes requested", className: "bg-red-700 text-white" },
};

export function VendorSettingsPage() {
	const { user } = useAuth();
	const {
		verification,
		saveVerificationDetails,
		profile,
		saveProfile,
		uploadCertificate,
		uploadingCertificate,
	} = useVendorData();

	const status = STATUS_META[verification.status] ?? STATUS_META.NOT_VERIFIED;

	return (
		<Tabs
			defaultValue="profile"
			orientation="vertical"
			className="grid gap-8 lg:grid-cols-[minmax(0,240px)_1fr]"
		>
			<div className="flex flex-col gap-3">
				<TabsList className="flex w-full flex-col items-stretch gap-1 rounded-none bg-transparent p-0 group-data-vertical/tabs:h-fit">
					{SECTIONS.map((section) => (
						<TabsTrigger
							key={section.value}
							value={section.value}
							className="flex h-10 w-full items-center justify-start gap-3 rounded-lg border border-border bg-card px-4 text-sm font-medium whitespace-nowrap data-[state=active]:border-[#00712D] data-[state=active]:bg-[#00712D] data-[state=active]:text-white data-[state=active]:shadow-none"
						>
							<FontAwesomeIcon icon={section.icon} className="shrink-0" />
							{section.label}
						</TabsTrigger>
					))}
				</TabsList>

				<Badge className={`mx-1 w-fit ${status.className}`}>
					{status.label}
				</Badge>
			</div>

			<div className="min-w-0 space-y-6">
				<TabsContent value="profile" className="mt-0 space-y-6">
					{user ? <AccountPhotoCard user={user} /> : null}

					<CompanyProfileForm
						companyName={profile?.companyName}
						description={profile?.description ?? undefined}
						serviceCategory={profile?.serviceCategory}
						location={profile?.location}
						tdp={profile?.tdp}
						onSave={saveProfile}
					/>
				</TabsContent>

				<TabsContent value="verification" className="mt-0">
					<VerificationStatusCard
						verification={verification}
						onSave={(nib, npwp) => saveVerificationDetails({ nib, npwp })}
						onUploadCertificate={uploadCertificate}
						uploading={uploadingCertificate}
					/>
				</TabsContent>

				<TabsContent value="certifications" className="mt-0">
					<CertificationsCard
						certifications={verification.certifications}
						verified={verification.status === "VERIFIED"}
					/>
				</TabsContent>

				<TabsContent value="documents" className="mt-0">
					<DocumentsVaultCard />
				</TabsContent>

				<TabsContent value="security" className="mt-0">
					<SecurityCard />
				</TabsContent>
			</div>
		</Tabs>
	);
}
