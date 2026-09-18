import {
	faCheckCircle,
	faExclamationTriangle,
	faFileAlt,
	faFileSignature,
	faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { ProcurementMethod } from "../lib/types";

interface ProjectProcurementActionCardProps {
	isVerified: boolean;
	procurementMethod: ProcurementMethod;
}

export function ProjectProcurementActionCard({
	isVerified,
	procurementMethod,
}: ProjectProcurementActionCardProps) {
	return (
		<Card className="sticky top-6">
			<CardHeader>
				<CardTitle className="text-lg">Procurement Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isVerified ? (
					<div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
						<div className="flex items-center gap-2 font-semibold">
							<FontAwesomeIcon
								icon={faExclamationTriangle}
								className="text-amber-600"
							/>
							Company Verification Required
						</div>
						<p>
							Your vendor profile has not completed automated verification. To
							submit competitive bids or technical proposals, please upload your
							corporate credentials first.
						</p>
						<Link to="/vendor/settings" className="block">
							<Button
								size="sm"
								className="w-full bg-amber-600 text-white hover:bg-amber-700"
							>
								Complete Verification
							</Button>
						</Link>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
							<FontAwesomeIcon
								icon={faCheckCircle}
								className="text-emerald-600"
							/>
							<span>Your account is fully verified for this procurement.</span>
						</div>

						{procurementMethod === "OPEN_BIDDING" && (
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
									This opportunity uses <strong>Open Bidding</strong>. You can
									view real-time anonymized rank standings and revise your bid
									pricing before the tender closes.
								</p>
								<Link to="/vendor/opportunities">
									<Button className="w-full gap-2 bg-[#03442C] text-white hover:bg-[#03442C]/90">
										<FontAwesomeIcon icon={faHandshake} />
										Join Open Bidding
									</Button>
								</Link>
							</div>
						)}

						{procurementMethod === "CLOSED_BIDDING" && (
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
									This project uses <strong>Closed Bidding</strong>. Sealed
									proposals are submitted once without disclosing competitor
									pricing.
								</p>
								<Link to="/vendor/deals">
									<Button className="w-full gap-2 bg-[#03442C] text-white hover:bg-[#03442C]/90">
										<FontAwesomeIcon icon={faFileSignature} />
										Submit Sealed Proposal
									</Button>
								</Link>
							</div>
						)}

						{procurementMethod === "DIRECT_SELECTION" && (
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
									This project uses <strong>Direct Award</strong> negotiation.
								</p>
								<Link to="/vendor/deals">
									<Button className="w-full gap-2 bg-[#03442C] text-white hover:bg-[#03442C]/90">
										<FontAwesomeIcon icon={faFileSignature} />
										Respond to Client Invitation
									</Button>
								</Link>
							</div>
						)}
					</div>
				)}

				<div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
					<div className="flex items-center justify-between">
						<span>Supporting Documents:</span>
						<span className="font-semibold text-foreground">3 Files (PDF)</span>
					</div>
					<Button variant="outline" size="sm" className="mt-1 w-full gap-2">
						<FontAwesomeIcon icon={faFileAlt} />
						Download Tender Documents
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
