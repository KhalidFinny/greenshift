import type { PortfolioDetail } from "@greenshift/api/contracts";
import { DEMO_DETAILS } from "./demo-data";
import { usePortfolioDetails } from "./use-portfolio-details";
import { usePortfolioList, type PortfolioList } from "./use-portfolio-list";

export interface InvestorData extends PortfolioList {
	/** Portfolio details aligned with items by index (lazy per tab). */
	details: PortfolioDetail[];
	isPending: boolean;
	isError: boolean;
}

/**
 * Portfolio list + per-bond details with a demo fallback: an account with
 * zero bonds renders the demo portfolio so the dashboard is never an empty
 * shell (admin package convention). Details are only fetched for real bonds
 * — demo ids don't exist server-side — and only when a tab needs them.
 */
export function useInvestorData(): InvestorData {
	const list = usePortfolioList();
	const detailQueries = usePortfolioDetails(list.isDemo ? [] : list.items);
	const detailsLoading = detailQueries.some((query) => query.isPending);
	const details = list.isDemo
		? DEMO_DETAILS
		: detailQueries.flatMap((query) => (query.data ? [query.data] : []));

	return {
		...list,
		details,
		isPending: list.isPending || (!list.isDemo && detailsLoading),
		isError: list.isError || (!list.isDemo && detailQueries.some((query) => query.isError)),
	};
}
