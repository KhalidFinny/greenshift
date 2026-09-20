import { MatchmakingBidding } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_auth/business/matchmaking/$projectId_/bidding",
)({
	component: BiddingRoute,
});

function BiddingRoute() {
	const { projectId } = Route.useParams();
	return <MatchmakingBidding projectId={projectId} />;
}
