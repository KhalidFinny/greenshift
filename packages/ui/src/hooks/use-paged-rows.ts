import { useMemo, useState } from "react";

export interface PagedRows<T> {
	pageRows: T[];
	pageIndex: number;
	pageSize: number;
	pageCount: number;
	total: number;
	setPageIndex: (index: number) => void;
	setPageSize: (size: number) => void;
}

export function usePagedRows<T>(rows: T[], initialPageSize = 10): PagedRows<T> {
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(initialPageSize);

	// Clamped on read, not corrected in an effect: a filter can shorten the list past the page.
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
		// A size change re-pages from the top: keeping the index would land the reader mid-page.
		setPageSize: (size: number) => {
			setPageSize(size);
			setPageIndex(0);
		},
	};
}
