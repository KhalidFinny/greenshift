import type { PortfolioItem } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export function usePortfolioQuery(): UseQueryResult<{ items: PortfolioItem[] }> {
	return useQuery({
		queryKey: ["investor", "portfolio"],
		queryFn: () => api.investor.portfolio(),
	});
}
