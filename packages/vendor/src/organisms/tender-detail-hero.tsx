import { faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Card, CardContent } from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { NegotiationRequest, StructuredProposal } from "../lib/types";

interface TenderDetailHeroProps {
	proposal: StructuredProposal;
	negotiation: NegotiationRequest;
}

export function TenderDetailHero({
	proposal,
	negotiation,
}: TenderDetailHeroProps) {
	return (
		<Card className="border-0 bg-[#03442C] text-white">
			<CardContent className="space-y-3 p-6">
				<div className="flex items-center justify-between">
					<Badge className="bg-emerald-500 font-bold text-white">
						Under Tender Evaluation
					</Badge>
					<span className="text-xs text-emerald-200">
						Proposal ID: {proposal.id}
					</span>
				</div>

				<h1 className="text-2xl font-bold text-white">
					{proposal.projectTitle}
				</h1>
				<p className="flex items-center gap-2 text-xs text-emerald-100">
					<FontAwesomeIcon icon={faBuilding} /> {proposal.companyName}
				</p>

				<div className="mt-2 grid grid-cols-2 gap-4 rounded-xl bg-white/10 p-4 text-xs sm:grid-cols-4">
					<div>
						<p className="text-emerald-200">Total Proposed Price</p>
						<p className="mt-1 text-sm font-bold text-white">
							{formatRupiah(proposal.costBreakdown.totalPrice)}
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Unit & Service Warranty</p>
						<p className="mt-1 text-sm font-bold text-white">
							{proposal.warrantyYears} Years
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Estimated Duration</p>
						<p className="mt-1 text-sm font-bold text-white">
							{proposal.estimatedDurationMonths} Months
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Negotiation Iteration</p>
						<p className="mt-1 text-sm font-bold text-emerald-300">
							Revision {negotiation.iterationNumber} of{" "}
							{negotiation.maxIterations}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
