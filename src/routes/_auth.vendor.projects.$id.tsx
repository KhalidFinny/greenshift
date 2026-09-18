import { VendorProjectDetailPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/projects/$id")({
	component: () => {
		const { id } = Route.useParams();
		return <VendorProjectDetailPage projectId={id} />;
	},
});
