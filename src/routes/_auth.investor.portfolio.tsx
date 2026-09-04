import { InvestorPortfolioPage } from "@greenshift/investor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/investor/portfolio")({
	component: InvestorPortfolioPage,
});
