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
	/** Saves the legal identity the administrator verifies against. */
	onSave: (nib: string, npwp: string) => void;
}

export function VerificationStatusCard({
	verification,
	onSave,
}: VerificationStatusCardProps) {
	const [nib, setNib] = useState(verification.nib ?? "");
	const [npwp, setNpwp] = useState(verification.npwp ?? "");

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
						An administrator verifies your vendor profile from the legal
						identity on file. Until then you can browse opportunities, but not
						bid.
					</p>

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
							Industry certifications (ESCO, ISO) are listed under
							Certifications. Document files are not collected in this build.
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
