import type {
	ActiveVendorProject,
	NegotiationRequest,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

export function countOpenBiddingProjects(
	projects: VendorProjectCardData[],
): number {
	return projects.filter((p) => p.procurementMethod === "OPEN_BIDDING").length;
}

export function countPendingNegotiations(
	negotiations: NegotiationRequest[],
): number {
	return negotiations.filter((n) => n.status === "PENDING_VENDOR_RESPONSE")
		.length;
}

export function calculateAverageProgress(
	activeProjects: ActiveVendorProject[],
): number {
	if (activeProjects.length === 0) return 0;
	const total = activeProjects.reduce(
		(sum, p) => sum + p.overallProgressPercent,
		0,
	);
	return Math.round(total / activeProjects.length);
}

export function calculateTotalPortfolioImpact(
	portfolio: VendorPortfolioItem[],
): {
	totalValue: number;
	totalCarbonTons: number;
} {
	return portfolio.reduce(
		(acc, item) => ({
			totalValue: acc.totalValue + item.projectValue,
			totalCarbonTons: acc.totalCarbonTons + (item.carbonReductionTons ?? 0),
		}),
		{ totalValue: 0, totalCarbonTons: 0 },
	);
}
