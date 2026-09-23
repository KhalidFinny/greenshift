import { useMemo, useState } from "react";

/** Pagination for a list a page renders itself. `DataTable` pages through
 * TanStack's row model, so this covers card grids, feeds and document rows. */
export interface PagedRows<T> {
	/** The rows of the current page, in the order they were given. */
	pageRows: T[];
	pageIndex: number;
	pageSize: number;
	/** Never below 1: an empty list is one empty page, not zero pages. */
	pageCount: number;
	/** How many rows the caller passed, before the slice. */
	total: number;
	setPageIndex: (index: number) => void;
	setPageSize: (size: number) => void;
}

export function usePagedRows<T>(rows: T[], initialPageSize = 10): PagedRows<T> {
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(initialPageSize);

	// A filter that shortens the list can leave the current page past its end,
	// so the index is clamped on read rather than corrected in an effect.
	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const current = Math.min(pageIndex, pageCount - 1);

	const pageRows = useMemo(
		() => rows.slice(current * pageSize, current * pageSize + pageSize),
		[rows, current, pageSize],
	);

	return {
		pageRows,
		pageIndex: current,
		pageSize,
		pageCount,
		total: rows.length,
		setPageIndex,
		// A size change re-pages from the top: keeping the index would land the
		// reader in the middle of a different page.
		setPageSize: (size: number) => {
			setPageSize(size);
			setPageIndex(0);
		},
	};
}
