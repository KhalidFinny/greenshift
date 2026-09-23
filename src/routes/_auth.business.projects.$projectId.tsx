import { ProjectDetail } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/projects/$projectId")({
	component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
	const { projectId } = Route.useParams();
	return <ProjectDetail projectId={projectId} />;
}
