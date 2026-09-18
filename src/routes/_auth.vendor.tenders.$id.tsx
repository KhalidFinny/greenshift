import { VendorTenderDetailPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/tenders/$id")({
	component: () => {
		const { id } = Route.useParams();
		return <VendorTenderDetailPage tenderId={id} />;
	},
});
