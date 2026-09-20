import { SubmitConfirmation } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/submitted/$projectId")({
	component: SubmittedRoute,
});

function SubmittedRoute() {
	const { projectId } = Route.useParams();
	return <SubmitConfirmation projectId={projectId} />;
}
