import { useMemo, useState } from "react";

/**
 * Pagination for a list a page renders itself: the rows are a slice of what the
 * caller passed, and the state is the page's own.
 *
 * `DataTable` pages itself through TanStack's row model, so this exists for the
 * lists that are not tables: card grids, feeds, document rows. Both surfaces
 * read the same control (`PaginationBar`), so a list and a table page the same
 * way.
 */
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
	// so the index is clamped on read rather than corrected in an effect: the
	// slice and the control always agree on the page being shown.
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
