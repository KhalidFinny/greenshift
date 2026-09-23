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
	cn,
	Input,
	Label,
} from "@greenshift/ui";
import { useRef, useState } from "react";
import { formatDate } from "../lib/format";
import type { CompanyVerificationDetails } from "../lib/types";

interface VerificationStatusCardProps {
	verification: CompanyVerificationDetails;
	/** Saves the legal identity the administrator verifies against. */
	onSave: (nib: string, npwp: string) => void;
	/** Files the ESCO or ISO certificate. */
	onUploadCertificate: (file: File) => void;
	uploading: boolean;
}

/** What the administrator reads before verifying, in the order it is checked. */
function missingPackItems(verification: CompanyVerificationDetails): string[] {
	const missing: string[] = [];
	if (!verification.npwp) missing.push("Tax identification number (NPWP)");
	if (!verification.tdp) missing.push("Company registration number (TDP)");
	if (verification.certifications.length === 0)
		missing.push("At least one certification entry");
	if (!verification.certificateName) missing.push("The certificate file");
	return missing;
}

export function VerificationStatusCard({
	verification,
	onSave,
	onUploadCertificate,
	uploading,
}: VerificationStatusCardProps) {
	const [nib, setNib] = useState(verification.nib ?? "");
	const [npwp, setNpwp] = useState(verification.npwp ?? "");
	const inputRef = useRef<HTMLInputElement | null>(null);
	const missing = missingPackItems(verification);
	const scan = verification.certificateScan;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSave(nib.trim(), npwp.trim());
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between text-lg">
						<span className="flex items-center gap-2">
							<FontAwesomeIcon
								icon={faShieldAlt}
								className="text-emerald-700"
							/>
							Verification Status
						</span>
						{verification.status === "VERIFIED" && (
							<Badge className="gap-1 bg-emerald-700 font-bold text-white">
								<FontAwesomeIcon icon={faCheckCircle} /> Verified
							</Badge>
						)}
						{verification.status === "VERIFYING" && (
							<Badge className="gap-1 bg-blue-600 font-bold text-white">
								<FontAwesomeIcon icon={faSpinner} className="animate-spin" />{" "}
								Checking Documents...
							</Badge>
						)}
						{verification.status === "NOT_VERIFIED" && (
							<Badge className="bg-amber-700 font-bold text-white">
								Not Verified
							</Badge>
						)}
						{verification.status === "REJECTED" && (
							<Badge className="bg-red-600 font-bold text-white">
								Rejected - Revision Required
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p className="text-muted-foreground">
						An administrator verifies your vendor profile from the documents on
						file: your tax number, your company registration number, your
						certifications, and the certificate itself. Until then you can
						browse opportunities, but not bid.
					</p>

					{verification.status === "REJECTED" &&
					verification.rejectionReason ? (
						<div className="space-y-1 rounded-xl border border-red-300 bg-red-50 p-4 text-red-950">
							<p className="font-bold">What has to be corrected</p>
							<p className="leading-6">{verification.rejectionReason}</p>
						</div>
					) : null}

					{verification.status === "VERIFIED" && (
						<div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
							<div className="flex items-center gap-2 text-sm font-bold">
								<FontAwesomeIcon
									icon={faUserCheck}
									className="text-emerald-700"
								/>
								Your Company Is Verified
							</div>
							<p>
								Your profile was verified on{" "}
								<span className="font-semibold">
									{formatDate(verification.verifiedAt)}
								</span>
								.
							</p>
							<p className="pt-1 text-sm font-medium text-emerald-700">
								You are eligible for Open Bidding, Closed Bidding, Direct
								Selection, and proposal submission.
							</p>
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="space-y-4 border-t border-border pt-4"
					>
						<h4 className="text-sm font-bold text-foreground">
							Legal Identity
						</h4>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="v-nib" className="text-sm font-semibold">
									Business Identification Number (NIB):
								</Label>
								<Input
									id="v-nib"
									value={nib}
									onChange={(e) => setNib(e.target.value)}
									placeholder="Enter the 13-digit NIB..."
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="v-npwp" className="text-sm font-semibold">
									Tax Identification Number (NPWP):
								</Label>
								<Input
									id="v-npwp"
									value={npwp}
									onChange={(e) => setNpwp(e.target.value)}
									placeholder="Enter the company NPWP..."
								/>
							</div>
						</div>

						<p className="text-muted-foreground">
							The company registration number (TDP) is on the Profile tab.
							Industry certifications (ESCO, ISO) are listed under
							Certifications.
						</p>

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								className="gap-2 bg-[#00712D] text-white hover:bg-[#00712D]/90"
							>
								<FontAwesomeIcon icon={faUpload} />
								Save Legal Identity
							</Button>
						</div>
					</form>

					<div className="space-y-3 border-t border-border pt-4">
						<h4 className="text-sm font-bold text-foreground">
							Industry Certificate
						</h4>
						<p className="text-muted-foreground">
							File your ESCO licence or your ISO energy management certificate.
							It is read automatically, and the reading is shown here and to the
							administrator reviewing your profile.
						</p>

						<div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-4">
							<div className="min-w-0">
								<p className="text-sm font-semibold">
									{verification.certificateName ?? "Nothing filed yet."}
								</p>
								{scan ? (
									<p className="mt-0.5 text-sm text-muted-foreground">
										Read as {scan.documentType ?? "an unreadable document"}
										{scan.companyName ? `, naming ${scan.companyName}` : ""}.
									</p>
								) : null}
							</div>
							{scan ? (
								<Badge
									className={cn(
										"shrink-0",
										scan.verdict === "PASSED"
											? "bg-emerald-700 text-white"
											: scan.verdict === "MISMATCH"
												? "bg-red-700 text-white"
												: "bg-amber-700 text-white",
									)}
								>
									{scan.verdict === "PASSED"
										? "Read and matched"
										: scan.verdict === "MISMATCH"
											? "Did not match"
											: "Could not be read"}
								</Badge>
							) : null}
						</div>

						{scan ? (
							<div className="rounded-lg bg-muted/50 px-3 py-2">
								<p className="text-sm leading-6">{scan.note}</p>
							</div>
						) : null}

						<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
							<input
								ref={inputRef}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png,.webp"
								className="sr-only"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) onUploadCertificate(file);
									event.target.value = "";
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={uploading}
								onClick={() => inputRef.current?.click()}
							>
								<FontAwesomeIcon icon={faUpload} aria-hidden />
								{verification.certificateName
									? "Replace the certificate"
									: "File the certificate"}
							</Button>
							{verification.certificateName && verification.certificateUrl ? (
								<a
									href={verification.certificateUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-medium text-blue-700 hover:underline"
								>
									Open the filed certificate
								</a>
							) : null}
						</div>

						{verification.status !== "VERIFIED" && missing.length > 0 ? (
							<p className="text-muted-foreground">
								Still needed before an administrator can verify:{" "}
								{missing.join(", ")}.
							</p>
						) : null}
						{verification.status !== "VERIFIED" && missing.length === 0 ? (
							<p className="font-medium text-emerald-700">
								Your pack is complete and waiting for an administrator.
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<FontAwesomeIcon icon={faLock} className="text-amber-700" />
						Vendor Access Boundaries
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					<p>
						Per the VENDORROLE.md specification, vendor accounts follow these
						role boundaries:
					</p>
					<ul className="list-disc space-y-1 pl-5">
						<li>
							Vendors <strong className="text-foreground">cannot</strong> edit
							client project data or the project risk assessment.
						</li>
						<li>
							Vendors <strong className="text-foreground">cannot</strong> access
							investor financials or private competitor bid information.
						</li>
						<li>
							Vendors <strong className="text-foreground">cannot</strong> edit
							matchmaking fit scores or performance scores generated by the
							system.
						</li>
						<li>
							Vendors <strong className="text-foreground">cannot</strong> clear
							or approve their own milestones; client approval is required.
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
