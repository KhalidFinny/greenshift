import { VendorPortfolioPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

// Nav calls this "Portfolio"; the performance scorecard lives at /vendor/portfolio-performance.
export const Route = createFileRoute("/_auth/vendor/portfolio/")({
	component: VendorPortfolioPage,
});
