import { ShimmerBlock } from "@greenshift/ui";

interface TableSkeletonProps {
	headers: string[];
	search?: boolean;
	rows?: number;
}

/** Loading frame for a `DataTable`: the headers are passed in rather than guessed, so it stays aligned with the real columns. */
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
