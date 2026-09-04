import { InvestorBondDetail } from "@greenshift/investor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/investor/portfolio/$id")({
	component: () => {
		const { id } = Route.useParams();
		return <InvestorBondDetail investmentId={Number(id)} />;
	},
});
