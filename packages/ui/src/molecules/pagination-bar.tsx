import { Button } from "../atoms/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../atoms/select";

/** The sizes a paged list offers, `"all"` being "show everything". */
export const PAGE_SIZE_OPTIONS: Array<number | "all"> = [10, 25, 50, "all"];

export interface PaginationBarProps {
	pageIndex: number;
	pageSize: number;
	pageCount: number;
	/** How many rows are being paged, for the "all" size. */
	total: number;
	onPageIndexChange: (index: number) => void;
	onPageSizeChange: (size: number) => void;
	pageSizeOptions?: Array<number | "all">;
	/** What is being paged, so the buttons are named for a screen reader. */
	label: string;
}

/** The one pagination control, shared by `DataTable` and self-paged lists. It
 * renders nothing for a single page, where it could only say "Page 1 of 1". */
export function PaginationBar({
	pageIndex,
	pageSize,
	pageCount,
	total,
	onPageIndexChange,
	onPageSizeChange,
	pageSizeOptions = PAGE_SIZE_OPTIONS,
	label,
}: PaginationBarProps) {
	if (pageCount <= 1) return null;

	/* The select must be able to show the size in use, so a non-standard page size
	   is added to its options; a size standing in for "all" is left out. */
	const sizes = [
		...new Set([...pageSizeOptions, pageSize >= total ? null : pageSize]),
	]
		.flatMap((size) => (typeof size === "number" ? [size] : []))
		.sort((a, b) => a - b);
	const options: Array<number | "all"> = pageSizeOptions.includes("all")
		? [...sizes, "all"]
		: sizes;

	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">Show</span>
					<Select
						value={pageSize >= total ? "all" : String(pageSize)}
						onValueChange={(value) =>
							onPageSizeChange(value === "all" ? total || 1 : Number(value))
						}
					>
						<SelectTrigger
							className="h-8 w-[80px] text-sm"
							aria-label={`${label}: rows per page`}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{options.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size === "all" ? "All" : size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<p className="text-base text-muted-foreground">
					Page {pageIndex + 1} of {pageCount}
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					onClick={() => onPageIndexChange(pageIndex - 1)}
					disabled={pageIndex <= 0}
					aria-label={`${label}: previous page`}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					onClick={() => onPageIndexChange(pageIndex + 1)}
					disabled={pageIndex >= pageCount - 1}
					aria-label={`${label}: next page`}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
