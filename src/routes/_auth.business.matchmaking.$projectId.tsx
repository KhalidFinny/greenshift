import { MatchmakingDetail } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/matchmaking/$projectId")({
	component: MatchmakingDetailRoute,
});

function MatchmakingDetailRoute() {
	const { projectId } = Route.useParams();
	return <MatchmakingDetail projectId={projectId} />;
}
