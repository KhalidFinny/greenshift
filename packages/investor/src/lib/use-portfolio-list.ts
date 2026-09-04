import type { PortfolioItem } from "@greenshift/api/contracts";
import { DEMO_PORTFOLIO } from "./demo-data";
import { usePortfolioQuery } from "./use-portfolio";

export interface PortfolioList {
	items: PortfolioItem[];
	isPending: boolean;
	isError: boolean;
	/** True when the account has no bonds yet and demo fixtures are shown. */
	isDemo: boolean;
}

/**
 * Portfolio list with demo fallback (admin package convention): an account
 * with zero bonds renders the demo portfolio so the UI is never an empty
 * shell. Real bonds bought later replace the demo view automatically.
 */
export function usePortfolioList(): PortfolioList {
	const query = usePortfolioQuery();
	const isDemo = query.isSuccess && query.data.items.length === 0;
	return {
		items: isDemo ? DEMO_PORTFOLIO : (query.data?.items ?? []),
		isPending: query.isPending,
		isError: query.isError,
		isDemo,
	};
}
