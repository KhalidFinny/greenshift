import { VendorPortfolioItemDetailPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/portfolio/$id")({
	component: () => {
		const { id } = Route.useParams();
		return <VendorPortfolioItemDetailPage itemId={id} />;
	},
});
