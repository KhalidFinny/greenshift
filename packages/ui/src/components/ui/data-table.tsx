import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "#/lib/utils";
import { Input } from "./input";
import { PaginationBar } from "./pagination-bar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

export interface DataTableProps<TData, TValue = unknown> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Stable row id. Defaults to the row index. */
	getRowId?: (originalRow: TData, index: number) => string;
	/** Accessible name for the table element. */
	ariaLabel?: string;
	className?: string;
	initialSorting?: SortingState;
	/**
	 * Rows per page. Every table pages: a table that renders its whole dataset
	 * at once is a table that grows without a bound. The footer is hidden while
	 * the rows fit one page.
	 */
	pageSize?: number;
	/** When set, renders a search input bound to the global filter. */
	searchPlaceholder?: string;
	emptyMessage?: string;
	onRowClick?: (row: TData) => void;
	/** Per-row classes, for a table that marks one row as picked or current. */
	rowClassName?: (row: TData) => string | undefined;
}

/** Optional per-column presentational metadata. */
export interface DataTableColumnMeta {
	className?: string;
	headClassName?: string;
}

function cellMeta(
	column: { columnDef: { meta?: unknown } },
	key: keyof DataTableColumnMeta,
): string | undefined {
	const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
	return meta?.[key];
}

export function DataTable<TData, TValue = unknown>({
	columns,
	data,
	getRowId,
	ariaLabel,
	className,
	initialSorting,
	pageSize = 10,
	searchPlaceholder,
	emptyMessage = "No results.",
	onRowClick,
	rowClassName,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>(
		initialSorting ?? [],
	);
	const [globalFilter, setGlobalFilter] = React.useState("");

	const table = useReactTable({
		data,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize } },
		getRowId,
	});

	return (
		<div className="space-y-4">
			{searchPlaceholder ? (
				<Input
					type="search"
					value={globalFilter}
					onChange={(event) => setGlobalFilter(event.target.value)}
					placeholder={searchPlaceholder}
					aria-label={searchPlaceholder}
					className="h-9 max-w-sm text-base"
				/>
			) : null}

			<Table aria-label={ariaLabel} className={cn("text-base", className)}>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const content = header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										);
								const canSort = header.column.getCanSort();
								const isSorted = header.column.getIsSorted();
								return (
									<TableHead
										key={header.id}
										className={cn(
											"text-base text-muted-foreground",
											cellMeta(header.column, "headClassName"),
										)}
										aria-sort={
											isSorted === "asc"
												? "ascending"
												: isSorted === "desc"
													? "descending"
													: undefined
										}
									>
										{canSort &&
										typeof header.column.columnDef.header === "string" ? (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className="-ml-2 inline-flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
											>
												{content}
												{isSorted === "asc" ? (
													<ArrowUp className="size-3.5" aria-hidden="true" />
												) : isSorted === "desc" ? (
													<ArrowDown className="size-3.5" aria-hidden="true" />
												) : (
													<ChevronsUpDown
														className="size-3.5 opacity-50"
														aria-hidden="true"
													/>
												)}
											</button>
										) : (
											content
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								// The message wraps rather than widening the table past
								// its container, so a long, filter-aware message cannot
								// reintroduce a sideways drag on a phone.
								className="h-24 text-center whitespace-normal text-muted-foreground"
							>
								{emptyMessage}
							</TableCell>
						</TableRow>
					) : (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								onClick={
									onRowClick ? () => onRowClick(row.original) : undefined
								}
								className={cn(
									onRowClick && "cursor-pointer",
									rowClassName?.(row.original),
								)}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cellMeta(cell.column, "className")}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<PaginationBar
				label={ariaLabel ?? "Table"}
				pageIndex={table.getState().pagination.pageIndex}
				pageSize={table.getState().pagination.pageSize}
				pageCount={table.getPageCount()}
				total={data.length}
				onPageIndexChange={(index) => table.setPageIndex(index)}
				onPageSizeChange={(size) => {
					table.setPageSize(size);
					table.setPageIndex(0);
				}}
			/>
		</div>
	);
}
