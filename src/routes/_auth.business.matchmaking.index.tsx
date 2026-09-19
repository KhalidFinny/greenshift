import { MatchmakingList } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/matchmaking/")({
	component: MatchmakingList,
});
