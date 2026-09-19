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
import { formatDate } from "../lib/format";
import type { CompanyVerificationDetails } from "../lib/types";

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
	const [nib, setNib] = useState(verification.nib ?? "");
	const [npwp, setNpwp] = useState(verification.npwp ?? "");
	const [legalDoc, setLegalDoc] = useState("");
	const [escoCert, setEscoCert] = useState("");

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
							<FontAwesomeIcon
								icon={faShieldAlt}
								className="text-emerald-700"
							/>
							Automatic Document Verification Status
						</span>
						{verification.status === "VERIFIED" && (
							<Badge className="gap-1 bg-emerald-700 font-bold text-white">
								<FontAwesomeIcon icon={faCheckCircle} /> Verified Automatically
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
						GreenShift verifies vendors automatically with document extraction.
						No manual admin approval is required.
					</p>

					{verification.status === "VERIFIED" && (
						<div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
							<div className="flex items-center gap-2 text-sm font-bold">
								<FontAwesomeIcon
									icon={faUserCheck}
									className="text-emerald-700"
								/>
								Your Company Is Fully Verified
							</div>
							<p>
								All legal documents (NIB, NPWP, and ESCO certificate) were
								validated successfully on{" "}
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
							Legal & Industry Verification Documents
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
									required
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
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="v-legaldoc" className="text-sm font-semibold">
									Primary Legal Document (PDF/SIUP):
								</Label>
								<Input
									id="v-legaldoc"
									value={legalDoc}
									onChange={(e) => setLegalDoc(e.target.value)}
									placeholder="SIUP_YourCompany.pdf"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="v-esco" className="text-sm font-semibold">
									ESCO Certificate / Industry License:
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
								className="gap-2 bg-[#00712D] text-white hover:bg-[#00712D]/90"
							>
								<FontAwesomeIcon icon={faUpload} />
								Run Automatic Verification
							</Button>
						</div>
					</form>
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
