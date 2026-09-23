import { ShimmerBlock } from "@greenshift/ui";

interface TableSkeletonProps {
	/** The real column labels, so the loading frame matches the table it replaces. */
	headers: string[];
	/** Mirrors the table's search field, which only some tables carry. */
	search?: boolean;
	rows?: number;
}

/** Loading frame for a `DataTable`: same search field, header row, and column count as the table it stands in for, with shimmering cells where the rows go.
 * The headers are passed in rather than guessed, so the skeleton stays aligned with the real columns. */
export function TableSkeleton({
	headers,
	search = false,
	rows = 5,
}: TableSkeletonProps) {
	return (
		<div className="space-y-4">
			{search ? <ShimmerBlock className="h-9 w-full max-w-sm" /> : null}

			<div className="relative w-full overflow-x-auto">
				<table className="w-full caption-bottom text-base">
					<thead className="[&_tr]:border-b">
						<tr className="border-b">
							{headers.map((header) => (
								<th
									key={header}
									scope="col"
									className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-muted-foreground"
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="[&_tr:last-child]:border-0">
						{Array.from({ length: rows }, (_, rowIndex) => (
							<tr key={rowIndex} className="border-b border-border/70">
								{headers.map((header) => (
									<td key={header} className="p-2 align-middle">
										<ShimmerBlock className="h-5 w-full max-w-32" />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
