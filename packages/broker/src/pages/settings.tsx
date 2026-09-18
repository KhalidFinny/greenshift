import {
	faBuilding,
	faCheckCircle,
	faClock,
	faFileContract,
	faFileUpload,
	faInfoCircle,
	faSave,
	faShieldAlt,
	faSpinner,
	faUserCheck,
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
	Input,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { useState } from "react";

import { useBrokerData } from "../lib/use-broker-data";

export function BrokerSettingsPage() {
	const {
		verification: verificationDetails,
		uploadBrokerVerificationDocs: runVerificationSimulation,
	} = useBrokerData();

	// Verification state
	const [nib, setNib] = useState(verificationDetails.nib || "");
	const [licenseNumber, setLicenseNumber] = useState(
		verificationDetails.financialLicenseNumber || "",
	);
	const [licenseAuthority, setLicenseAuthority] = useState(
		verificationDetails.licenseAuthority ||
			"Financial Services Authority (OJK)",
	);
	const [legalEntityName, setLegalEntityName] = useState(
		verificationDetails.legalEntityName || "Capital Green Securities Inc.",
	);

	// Profile Form state
	const [repName, setRepName] = useState("Budi Santoso, CSA");
	const [email, setEmail] = useState("budi.santoso@greensecurities.com");
	const [phone, setPhone] = useState("+62 812-9876-5432");
	const [address, setAddress] = useState(
		"Financial Club Tower 18th Fl, SCBD, South Jakarta, 12190",
	);
	const [isSaved, setIsSaved] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);

	const handleStartVerification = () => {
		setIsVerifying(true);
		setTimeout(() => {
			runVerificationSimulation(
				legalEntityName,
				nib,
				licenseNumber,
				licenseAuthority,
			);
			setIsVerifying(false);
		}, 1500);
	};

	const handleSaveProfile = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaved(true);
		setTimeout(() => setIsSaved(false), 3000);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Broker Settings</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage financial license verification, brokerage firm profile, and
					role boundary policies.
				</p>
			</div>

			<Tabs defaultValue="verification" className="w-full">
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="verification">License Verification</TabsTrigger>
					<TabsTrigger value="profile">Brokerage Profile</TabsTrigger>
					<TabsTrigger value="compliance">Role Boundaries</TabsTrigger>
				</TabsList>

				{/* Tab 1: Automatic Verification Simulation */}
				<TabsContent value="verification" className="mt-4 space-y-6">
					<Card>
						<CardHeader className="border-b border-border bg-muted/30">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<CardTitle className="text-lg flex items-center gap-2">
										<FontAwesomeIcon
											icon={faShieldAlt}
											className="text-[#03442C]"
										/>
										Brokerage License Verification Status
									</CardTitle>
									<CardDescription className="mt-1 text-xs">
										Brokerage institutions must verify official financial
										licensing before facilitating green bond underwriting.
									</CardDescription>
								</div>
								<div>
									{verificationDetails.status === "VERIFIED" && (
										<Badge className="bg-emerald-600 text-white font-bold gap-1 px-3 py-1 text-xs">
											<FontAwesomeIcon icon={faCheckCircle} /> OFFICIALLY
											VERIFIED
										</Badge>
									)}
									{verificationDetails.status === "VERIFYING" && (
										<Badge className="bg-amber-500 text-white font-bold gap-1 px-3 py-1 text-xs">
											<FontAwesomeIcon icon={faClock} /> VERIFYING
										</Badge>
									)}
									{verificationDetails.status === "NOT_VERIFIED" && (
										<Badge className="bg-slate-500 text-white font-bold gap-1 px-3 py-1 text-xs">
											NOT VERIFIED
										</Badge>
									)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-6 space-y-6">
							{verificationDetails.status === "VERIFIED" ? (
								<div className="rounded-xl bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 p-4 space-y-3">
									<div className="flex items-center gap-2 font-bold text-sm">
										<FontAwesomeIcon
											icon={faCheckCircle}
											className="text-emerald-600 text-lg"
										/>
										Institution Verification Successful & Active
									</div>
									<p className="text-xs leading-relaxed">
										{verificationDetails.legalEntityName} has been verified by{" "}
										{verificationDetails.licenseAuthority} under License Number:{" "}
										<span className="font-mono font-semibold">
											{verificationDetails.financialLicenseNumber}
										</span>
										.
									</p>
									<div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-emerald-200/50">
										<div>
											<span className="text-emerald-800 dark:text-emerald-300">
												Company Business ID (NIB):
											</span>{" "}
											<span className="font-semibold">
												{verificationDetails.nib}
											</span>
										</div>
										<div>
											<span className="text-emerald-800 dark:text-emerald-300">
												Verified Date:
											</span>{" "}
											<span className="font-semibold">
												{verificationDetails.verifiedAt}
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<p className="text-xs text-muted-foreground">
										Please submit your securities brokerage license documents
										for automated verification.
									</p>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-xs">Legal Entity Name</Label>
											<Input
												value={legalEntityName}
												onChange={(e) => setLegalEntityName(e.target.value)}
												placeholder="Capital Green Securities Inc."
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-xs">
												Business Identification Number (NIB)
											</Label>
											<Input
												value={nib}
												onChange={(e) => setNib(e.target.value)}
												placeholder="9120001234567"
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-xs">
												Securities Broker-Dealer License Number
											</Label>
											<Input
												value={licenseNumber}
												onChange={(e) => setLicenseNumber(e.target.value)}
												placeholder="KEP-88/D.04/2023"
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-xs">
												Regulatory Supervisory Authority
											</Label>
											<Input
												value={licenseAuthority}
												onChange={(e) => setLicenseAuthority(e.target.value)}
												placeholder="Financial Services Authority (OJK)"
											/>
										</div>
									</div>

									<div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/20">
										<FontAwesomeIcon
											icon={faFileUpload}
											className="text-3xl text-muted-foreground mb-2"
										/>
										<p className="text-xs font-semibold">
											Upload License & Operational Permit Documents (PDF)
										</p>
										<p className="text-[11px] text-muted-foreground mt-1">
											Maximum 10MB per file. Official regulatory license and
											corporate charter copy.
										</p>
										<Button
											variant="outline"
											size="sm"
											className="mt-3 text-xs"
										>
											Select Document File
										</Button>
									</div>

									<div className="flex justify-end pt-2">
										<Button
											onClick={handleStartVerification}
											disabled={isVerifying}
											className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-2 text-xs"
										>
											{isVerifying ? (
												<>
													<FontAwesomeIcon icon={faSpinner} spin />
													Verifying Documents...
												</>
											) : (
												<>
													<FontAwesomeIcon icon={faUserCheck} />
													Run Automated Verification
												</>
											)}
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 2: Profile Settings */}
				<TabsContent value="profile" className="mt-4 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon icon={faBuilding} className="text-[#03442C]" />
								Firm Profile & Broker Representative
							</CardTitle>
							<CardDescription className="text-xs">
								Official contact details of the broker representative displayed
								to client companies.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-6">
							<form onSubmit={handleSaveProfile} className="space-y-4">
								{isSaved && (
									<div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs flex items-center gap-2">
										<FontAwesomeIcon icon={faCheckCircle} />
										Broker representative profile successfully updated!
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-xs">
											Official Broker Representative Name
										</Label>
										<Input
											value={repName}
											onChange={(e) => setRepName(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs">Official Corporate Email</Label>
										<Input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs">
											Office Phone / Mobile Number
										</Label>
										<Input
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs">
											Headquarters Office Address
										</Label>
										<Input
											value={address}
											onChange={(e) => setAddress(e.target.value)}
										/>
									</div>
								</div>

								<div className="flex justify-end pt-2">
									<Button
										type="submit"
										className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-2 text-xs"
									>
										<FontAwesomeIcon icon={faSave} />
										Save Profile Changes
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 3: Role Boundaries & Compliance */}
				<TabsContent value="compliance" className="mt-4 space-y-6">
					<Card className="border-l-4 border-l-[#03442C]">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon
									icon={faFileContract}
									className="text-[#03442C]"
								/>
								Broker Role Boundaries & Compliance
							</CardTitle>
							<CardDescription className="text-xs">
								Architectural policies and compliance guidelines for green
								brokers on GreenShift.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-6 space-y-4 text-xs">
							<div className="space-y-3">
								<div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
									<FontAwesomeIcon
										icon={faInfoCircle}
										className="text-[#03442C] text-base mt-0.5"
									/>
									<div>
										<p className="font-semibold text-foreground">
											Restricted Interaction to Client Companies
										</p>
										<p className="text-muted-foreground mt-0.5">
											Brokers only interact directly with the **Client Company**
											for document collection and bond underwriting preparation.
											Brokers do not coordinate directly with Vendors.
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
									<FontAwesomeIcon
										icon={faInfoCircle}
										className="text-[#03442C] text-base mt-0.5"
									/>
									<div>
										<p className="font-semibold text-foreground">
											No In-App Bond Trading or Transactions
										</p>
										<p className="text-muted-foreground mt-0.5">
											Brokers **DO NOT PURCHASE** or trade green bonds directly
											inside the GreenShift platform. Bond issuances are tracked
											externally (External Bond Issuance Tracker).
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
									<FontAwesomeIcon
										icon={faInfoCircle}
										className="text-[#03442C] text-base mt-0.5"
									/>
									<div>
										<p className="font-semibold text-foreground">
											Risk Assessment & Reports are Read-Only
										</p>
										<p className="text-muted-foreground mt-0.5">
											Project Risk Assessments and Monthly Monitoring Reports
											are strictly **Read-Only** to maintain tamper-free
											transparency with external investors.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
