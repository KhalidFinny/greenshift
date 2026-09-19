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
import { Button } from "./button";
import { Input } from "./input";
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
	/** When set, enables the pagination footer with this page size. */
	pageSize?: number;
	/** When set, renders a search input bound to the global filter. */
	searchPlaceholder?: string;
	emptyMessage?: string;
	onRowClick?: (row: TData) => void;
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
	pageSize,
	searchPlaceholder,
	emptyMessage = "No results.",
	onRowClick,
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
		getPaginationRowModel: pageSize ? getPaginationRowModel() : undefined,
		initialState: pageSize ? { pagination: { pageSize } } : undefined,
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
								className="h-24 text-center text-muted-foreground"
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
								className={onRowClick ? "cursor-pointer" : undefined}
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

			{pageSize ? (
				<div className="flex items-center justify-between gap-4">
					<p className="text-base text-muted-foreground">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Next
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
