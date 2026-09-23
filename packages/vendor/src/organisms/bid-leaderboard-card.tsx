import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	EmptyState,
	PaginationBar,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";

interface BidLeaderboardProps {
	/** Entries as ranked by the API: lowest amount leads. */
	leaderboard: Array<{
		rank: number;
		vendorName: string;
		currentPrice: number;
		isCurrentVendor: boolean;
	}>;
	/** Ranking still in flight: same list frame, shimmering rows. */
	loading?: boolean;
}

export function BidLeaderboard({
	leaderboard,
	loading = false,
}: BidLeaderboardProps) {
	const paged = usePagedRows(leaderboard);

	// One list frame; each row is either a ranked bid or a shimmer.
	const rows: (BidLeaderboardProps["leaderboard"][number] | null)[] = loading
		? Array.from({ length: 4 }, () => null)
		: paged.pageRows;

	if (!loading && rows.length === 0) {
		return (
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<FontAwesomeIcon icon={faTrophy} className="text-amber-700" />
					<h3 className="text-lg font-semibold text-foreground">
						Live Rankings
					</h3>
				</div>
				<EmptyState
					icon={<FontAwesomeIcon icon={faTrophy} />}
					title="No bids placed on this tender yet"
					description="Rankings update as offers come in. Your position appears here as soon as the tender receives its first bids."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<FontAwesomeIcon icon={faTrophy} className="text-amber-700" />
				<h3 className="text-lg font-semibold text-foreground">Live Rankings</h3>
			</div>

			<div className="space-y-2">
				{rows.map((entry, i) => (
					<div
						key={entry?.rank ?? i}
						className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${
							entry?.isCurrentVendor
								? "bg-emerald-50 ring-1 ring-emerald-200"
								: "bg-muted/50"
						}`}
						style={{
							animation: loading
								? undefined
								: `slideUp 0.3s ease-out ${i * 0.05}s both`,
						}}
					>
						<div className="flex items-center gap-3">
							{entry ? (
								<span
									className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
										entry.rank === 1
											? "bg-amber-400 text-amber-950"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{entry.rank}
								</span>
							) : (
								<ShimmerBlock className="size-8 shrink-0 rounded-full" />
							)}
							{entry ? (
								<span className="text-sm font-medium">
									{entry.isCurrentVendor ? "Your Bid" : entry.vendorName}
								</span>
							) : (
								<ShimmerBlock className="h-4 w-32" />
							)}
						</div>
						{entry ? (
							<span className="text-sm font-bold text-foreground">
								{formatRupiah(entry.currentPrice)}
							</span>
						) : (
							<ShimmerBlock className="h-4 w-24" />
						)}
					</div>
				))}
			</div>

			<PaginationBar
				label="Live rankings"
				pageIndex={paged.pageIndex}
				pageSize={paged.pageSize}
				pageCount={paged.pageCount}
				total={paged.total}
				onPageIndexChange={paged.setPageIndex}
				onPageSizeChange={paged.setPageSize}
			/>
		</div>
	);
}
