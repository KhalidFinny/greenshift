import { VendorPortfolioPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

// The nav labels this destination "Portfolio", so it renders the delivered track
// record. The performance scorecard lives at /vendor/portfolio-performance.
export const Route = createFileRoute("/_auth/vendor/portfolio/")({
	component: VendorPortfolioPage,
});
