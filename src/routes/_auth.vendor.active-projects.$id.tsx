import { VendorActiveProjectDetailPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/active-projects/$id")({
	component: () => {
		const { id } = Route.useParams();
		return <VendorActiveProjectDetailPage activeProjectId={id} />;
	},
});
