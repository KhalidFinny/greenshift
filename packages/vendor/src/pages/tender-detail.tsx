import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, EmptyState } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useVendorData } from "../lib/use-vendor-data";
import { TenderCostBreakdownCard } from "../organisms/tender-cost-breakdown-card";
import { TenderDetailHero } from "../organisms/tender-detail-hero";
import { TenderTechnicalProposalCard } from "../organisms/tender-technical-proposal-card";

export function VendorTenderDetailPage({ tenderId }: { tenderId?: string }) {
	const { proposals, negotiations } = useVendorData();

	const proposal =
		proposals.find((item) => item.tenderId === tenderId) ?? proposals[0];
	const negotiation = proposal
		? negotiations.find((item) => item.proposalId === proposal.id)
		: undefined;

	if (!proposal) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link to="/vendor/deals">
						<Button variant="ghost" size="sm" className="gap-2">
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to My Deals
						</Button>
					</Link>
				</div>
				<EmptyState
					title="Proposal not found"
					description="You have not submitted a proposal for this tender yet."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link to="/vendor/deals">
					<Button variant="ghost" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to My Deals
					</Button>
				</Link>
			</div>

			<TenderDetailHero proposal={proposal} negotiation={negotiation} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<TenderTechnicalProposalCard proposal={proposal} />
				</div>
				<div className="space-y-6">
					<TenderCostBreakdownCard costBreakdown={proposal.costBreakdown} />
				</div>
			</div>
		</div>
	);
}
