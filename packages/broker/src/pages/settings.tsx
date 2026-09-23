import {
	faBuilding,
	faCheckCircle,
	faClock,
	faFileContract,
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
import { useEffect, useState } from "react";

import { useBrokerData } from "../lib/use-broker-data";

export function BrokerSettingsPage() {
	const {
		verification: verificationDetails,
		profile,
		isLoading,
		uploadBrokerVerificationDocs: fileLicence,
		saveProfile,
	} = useBrokerData();

	// The firm profile arrives from the API; the form adopts it and submits licence data for review.
	const [nib, setNib] = useState("");
	const [licenseNumber, setLicenseNumber] = useState("");
	const [licenseAuthority, setLicenseAuthority] = useState("");
	const [legalEntityName, setLegalEntityName] = useState("");
	const [repName, setRepName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [loaded, setLoaded] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);

	// Adopt the API profile once it arrives (and after each save).
	useEffect(() => {
		if (isLoading || loaded) return;
		setNib(verificationDetails.nib ?? "");
		setLicenseNumber(verificationDetails.financialLicenseNumber ?? "");
		setLicenseAuthority(
			verificationDetails.licenseAuthority ??
				"Financial Services Authority (OJK)",
		);
		setLegalEntityName(verificationDetails.legalEntityName);
		setRepName(profile.representative);
		setEmail(profile.contactEmail);
		setPhone(profile.contactPhone);
		setAddress(profile.address);
		setLoaded(true);
	}, [isLoading, loaded, profile, verificationDetails]);

	const handleStartVerification = (e: React.FormEvent) => {
		e.preventDefault();
		setIsVerifying(true);
		fileLicence(legalEntityName, nib, licenseNumber, licenseAuthority);
		setIsVerifying(false);
	};

	const handleSaveProfile = (e: React.FormEvent) => {
		e.preventDefault();
		saveProfile({
			representative: repName,
			contactEmail: email,
			contactPhone: phone,
			address,
		});
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
				<TabsList className="flex w-full overflow-x-auto *:shrink-0 *:whitespace-nowrap sm:grid sm:grid-cols-3 max-w-md">
					<TabsTrigger value="verification">License Verification</TabsTrigger>
					<TabsTrigger value="profile">Brokerage Profile</TabsTrigger>
					<TabsTrigger value="compliance">Role Boundaries</TabsTrigger>
				</TabsList>

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
									<CardDescription className="mt-1 text-sm">
										Brokerage institutions must verify official financial
										licensing before facilitating green bond underwriting.
									</CardDescription>
								</div>
								<div>
									{verificationDetails.status === "VERIFIED" && (
										<Badge className="bg-emerald-700 text-white font-bold gap-1 px-3 py-1 text-sm">
											<FontAwesomeIcon icon={faCheckCircle} /> OFFICIALLY
											VERIFIED
										</Badge>
									)}
									{verificationDetails.status === "VERIFYING" && (
										<Badge className="bg-amber-700 text-white font-bold gap-1 px-3 py-1 text-sm">
											<FontAwesomeIcon icon={faClock} /> VERIFYING
										</Badge>
									)}
									{verificationDetails.status === "NOT_VERIFIED" && (
										<Badge className="bg-slate-500 text-white font-bold gap-1 px-3 py-1 text-sm">
											NOT VERIFIED
										</Badge>
									)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-6 space-y-6">
							{verificationDetails.status === "VERIFIED" ? (
								<div className="rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200 p-4 space-y-3">
									<div className="flex items-center gap-2 font-bold text-sm">
										<FontAwesomeIcon
											icon={faCheckCircle}
											className="text-emerald-700 text-lg"
										/>
										Institution Verification Successful & Active
									</div>
									<p className="text-sm leading-relaxed">
										{verificationDetails.legalEntityName} has been verified by{" "}
										{verificationDetails.licenseAuthority} under License Number:{" "}
										{/* Monospace so a hand-transcribed licence number keeps 0/O and 1/l apart. */}
										<span className="font-mono font-semibold">
											{verificationDetails.financialLicenseNumber}
										</span>
										.
									</p>
									<div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-emerald-200/50">
										<div>
											<span className="text-emerald-800">
												Company Business ID (NIB):
											</span>{" "}
											<span className="font-semibold">
												{verificationDetails.nib}
											</span>
										</div>
										<div>
											<span className="text-emerald-800">Verified Date:</span>{" "}
											<span className="font-semibold">
												{verificationDetails.verifiedAt}
											</span>
										</div>
									</div>
								</div>
							) : (
								<form onSubmit={handleStartVerification} className="space-y-4">
									<p className="text-sm text-muted-foreground">
										File your securities brokerage licence data. The platform
										verifies it before you can receive project assignments.
									</p>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm">Legal Entity Name</Label>
											<Input
												value={legalEntityName}
												onChange={(e) => setLegalEntityName(e.target.value)}
												placeholder="Capital Green Securities Inc."
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-sm">
												Business Identification Number (NIB)
											</Label>
											<Input
												value={nib}
												onChange={(e) => setNib(e.target.value)}
												placeholder="9120001234567"
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-sm">
												Securities Broker-Dealer License Number
											</Label>
											<Input
												value={licenseNumber}
												onChange={(e) => setLicenseNumber(e.target.value)}
												placeholder="KEP-88/D.04/2023"
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-sm">
												Regulatory Supervisory Authority
											</Label>
											<Input
												value={licenseAuthority}
												onChange={(e) => setLicenseAuthority(e.target.value)}
												placeholder="Financial Services Authority (OJK)"
											/>
										</div>
									</div>

									<div className="flex justify-end pt-2">
										<Button
											onClick={handleStartVerification}
											type="submit"
											disabled={isVerifying}
											className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-2 text-sm"
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
								</form>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="profile" className="mt-4 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon icon={faBuilding} className="text-[#03442C]" />
								Firm Profile & Broker Representative
							</CardTitle>
							<CardDescription className="text-sm">
								Official contact details of the broker representative displayed
								to client companies.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-6">
							<form onSubmit={handleSaveProfile} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-sm">
											Official Broker Representative Name
										</Label>
										<Input
											value={repName}
											onChange={(e) => setRepName(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-sm">Official Corporate Email</Label>
										<Input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-sm">
											Office Phone / Mobile Number
										</Label>
										<Input
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-sm">
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
										className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-2 text-sm"
									>
										<FontAwesomeIcon icon={faSave} />
										Save Profile Changes
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

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
							<CardDescription className="text-sm">
								Architectural policies and compliance guidelines for green
								brokers on GreenShift.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-6 space-y-4 text-sm">
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
