import {
	faFileSignature,
	faGavel,
	faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	EmptyState,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useVendorData } from "../lib/use-vendor-data";
import { ClosedBidCard } from "../organisms/closed-bid-card";
import { NegotiationCard } from "../organisms/negotiation-card";
import { OpenBidLeaderboard } from "../organisms/open-bid-leaderboard";
import { ProposalCard } from "../organisms/proposal-card";

export function VendorTendersPage() {
	const {
		leaderboard,
		leaderboardMeta,
		placeOpenBid,
		proposals,
		negotiations,
		submitNegotiationResponse,
	} = useVendorData();

	const hasOpenBidding = leaderboard.length > 0;
	const sealedBids = proposals.filter(
		(proposal) => proposal.procurementMethod === "CLOSED_BIDDING",
	);

	return (
		<div className="space-y-6">
			<Tabs defaultValue="active">
				<TabsList className="flex w-full flex-wrap gap-1 md:grid md:grid-cols-4 md:gap-0">
					<TabsTrigger value="active" className="flex-1 md:flex-none">
						Active Tenders
					</TabsTrigger>
					<TabsTrigger value="proposals" className="flex-1 md:flex-none">
						My Proposals ({proposals.length})
					</TabsTrigger>
					<TabsTrigger value="negotiations" className="flex-1 md:flex-none">
						Negotiations ({negotiations.length})
					</TabsTrigger>
					<TabsTrigger value="completed" className="flex-1 md:flex-none">
						Completed
					</TabsTrigger>
				</TabsList>

				{/* Active Tenders Tab */}
				<TabsContent value="active" className="mt-6 space-y-6">
					{!hasOpenBidding && sealedBids.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faGavel} />}
							title="No tenders in progress"
							description="Open biddings you take part in and sealed bids under evaluation appear here until the client decides."
							action={
								<Link to="/vendor/opportunities">
									<Button size="sm">Browse Open Tenders</Button>
								</Link>
							}
						/>
					) : (
						<>
							{hasOpenBidding && (
								<OpenBidLeaderboard
									leaderboard={leaderboard}
									projectTitle={
										leaderboardMeta.projectTitle ?? "Open bidding tender"
									}
									deadlineAt={leaderboardMeta.deadlineAt}
									onRevise={placeOpenBid}
								/>
							)}

							{sealedBids.map((proposal) => (
								<ClosedBidCard
									key={proposal.id}
									title={proposal.projectTitle}
									submittedPrice={proposal.costBreakdown.totalPrice}
								/>
							))}
						</>
					)}
				</TabsContent>

				{/* My Proposals Tab */}
				<TabsContent value="proposals" className="mt-6 space-y-4">
					{proposals.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faFileSignature} />}
							title="No proposals submitted"
							description="Proposals you submit appear here with the client's evaluation status."
							action={
								<Link to="/vendor/opportunities">
									<Button size="sm">Find a Tender</Button>
								</Link>
							}
						/>
					) : (
						proposals.map((prop) => (
							<ProposalCard key={prop.id} proposal={prop} />
						))
					)}
				</TabsContent>

				{/* Negotiations Tab */}
				<TabsContent value="negotiations" className="mt-6 space-y-4">
					{negotiations.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faHandshake} />}
							title="No negotiations open"
							description="A client opens a structured negotiation after evaluating your proposal. Nothing is waiting on your response right now."
						/>
					) : (
						negotiations.map((neg) => (
							<NegotiationCard
								key={neg.id}
								negotiation={neg}
								onSubmitResponse={submitNegotiationResponse}
							/>
						))
					)}
				</TabsContent>

				{/* Completed Tenders Tab */}
				<TabsContent value="completed" className="mt-6">
					<EmptyState
						icon={<FontAwesomeIcon icon={faGavel} />}
						title="No closed tenders in the last 30 days"
						description="Tenders you bid on are listed here for 30 days after the client closes them, then they leave your active history."
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
