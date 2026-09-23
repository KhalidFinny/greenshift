import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@greenshift/core";
import { Badge, EmptyState } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { mapProposalDetail } from "../lib/api-mappers";
import { formatRupiah, formatShortDate } from "../lib/format";
import { PROPOSAL_STATUS_LABEL } from "../lib/labels";
import { useVendorData } from "../lib/use-vendor-data";
import { DetailHero, DetailShell } from "../molecules/detail-shell";
import { NegotiationCard } from "../organisms/negotiation-card";
import { TenderCostBreakdownCard } from "../organisms/tender-cost-breakdown-card";
import { TenderTechnicalProposalCard } from "../organisms/tender-technical-proposal-card";

export function VendorTenderDetailPage({ tenderId }: { tenderId?: string }) {
	const { isLoading, proposals, negotiations, submitNegotiationResponse } =
		useVendorData();

	// The list row carries only a summary; the technical and commercial fields live on the detail endpoint.
	const summary =
		proposals.find((item) => item.tenderId === tenderId) ?? proposals[0];

	const detailQuery = useQuery({
		queryKey: ["vendor", "proposal-detail", summary?.id],
		enabled: Boolean(summary?.id),
		queryFn: () => api.vendor.proposalDetail(Number(summary?.id)),
	});

	const proposal = detailQuery.data
		? mapProposalDetail(detailQuery.data.proposal)
		: summary;
	const detailLoading = Boolean(summary) && detailQuery.isPending;
	const negotiation = proposal
		? negotiations.find((item) => item.proposalId === proposal.id)
		: undefined;

	if (!isLoading && !summary) {
		return (
			<DetailShell
				backTo="/vendor/deals"
				backLabel="Back to My Deals"
				hero={null}
			>
				<EmptyState
					title="Proposal not found"
					description="You have not submitted a proposal for this tender yet."
				/>
			</DetailShell>
		);
	}

	// Only figures the API reports. Anything absent says so instead of guessing.
	const notReported = "Not reported";

	return (
		<DetailShell
			backTo="/vendor/deals"
			backLabel="Back to My Deals"
			hero={
				<DetailHero
					loading={isLoading}
					title={proposal?.projectTitle}
					badges={
						<>
							<Badge
								variant="outline"
								className="border-white/30 text-sm text-white"
							>
								{proposal ? PROPOSAL_STATUS_LABEL[proposal.status] : "Proposal"}
							</Badge>
							{proposal?.submittedAt ? (
								<div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
									<FontAwesomeIcon icon={faClock} className="text-sm" />
									<span>Submitted {formatShortDate(proposal.submittedAt)}</span>
								</div>
							) : null}
						</>
					}
					meta={
						proposal?.companyName ? (
							<span className="text-base text-emerald-100/80">
								{proposal.companyName}
							</span>
						) : null
					}
					stats={[
						{
							label: "Proposed value",
							value: formatRupiah(proposal?.costBreakdown.totalPrice),
						},
						{
							label: "Projected ROI",
							value:
								proposal?.projectedRoi != null
									? `${proposal.projectedRoi}%`
									: notReported,
						},
						{
							label: "Warranty",
							value:
								proposal?.warrantyPeriod != null
									? `${proposal.warrantyPeriod} years`
									: notReported,
						},
						{
							label: "Operational cost",
							value:
								proposal?.costBreakdown.operationalCost != null
									? formatRupiah(proposal.costBreakdown.operationalCost)
									: notReported,
						},
					]}
				/>
			}
			aside={
				negotiation ? (
					<NegotiationCard
						negotiation={negotiation}
						onSubmitResponse={submitNegotiationResponse}
					/>
				) : undefined
			}
		>
			<TenderTechnicalProposalCard
				technicalSpec={proposal?.technicalSpec ?? null}
				loading={detailLoading}
			/>
			<TenderCostBreakdownCard
				costBreakdown={
					proposal?.costBreakdown ?? { totalPrice: 0, operationalCost: null }
				}
				loading={detailLoading}
			/>
		</DetailShell>
	);
}
