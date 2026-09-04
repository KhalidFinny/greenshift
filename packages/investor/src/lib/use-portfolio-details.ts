import type { PortfolioDetail, PortfolioItem } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";

/**
 * One portfolio-detail fetch per holding (ROI schedule + emission reports).
 * Results are cached by bond id so the Impact/Transactions tabs and future
 * detail pages share the same payloads.
 */
export function usePortfolioDetails(
	items: PortfolioItem[],
): Array<UseQueryResult<PortfolioDetail>> {
	return useQueries({
		queries: items.map((item) => ({
			queryKey: ["investor", "portfolio", "detail", item.investment.id],
			queryFn: () => api.investor.portfolioDetail(item.investment.id),
		})),
	});
}
