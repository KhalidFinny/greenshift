import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ShimmerBlock,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { formatRupiah } from "../lib/format";
import type { NegotiationRequest, VendorProjectCardData } from "../lib/types";

type UrgencyFilter = "all" | "urgent" | "high" | "medium" | "low";

interface ActionItem {
	id: string;
	type: "negotiation" | "bid";
	urgency: "urgent" | "high" | "medium" | "low";
	title: string;
	subtitle: string;
	detail: string;
	deadline?: string;
	actionLabel: string;
	actionHref: string;
}

interface ActionRequiredCardProps {
	negotiations: NegotiationRequest[];
	projects: VendorProjectCardData[];
	leaderboard: { rank: number; isCurrentVendor: boolean }[];
	/** Inbox still in flight: same card, tabs and rows shimmer. */
	loading?: boolean;
}

const URGENCY_STYLES: Record<string, string> = {
	urgent: "bg-red-100 text-red-700 border-red-200",
	high: "bg-orange-100 text-orange-700 border-orange-200",
	medium: "bg-amber-100 text-amber-700 border-amber-200",
	low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const FILTERS = ["all", "urgent", "high", "medium", "low"] as const;

// Value threshold for high-value projects (IDR)
const HIGH_VALUE_THRESHOLD = 5_000_000_000;

function calculateUrgency(item: {
	type: string;
	urgency: string;
	projectValue?: number;
}): "urgent" | "high" | "medium" | "low" {
	// Manual priority takes precedence
	if (item.urgency !== "medium")
		return item.urgency as "urgent" | "high" | "medium" | "low";

	// Upgrade to high if project value is significant
	if (item.projectValue && item.projectValue >= HIGH_VALUE_THRESHOLD) {
		return "high";
	}

	return item.urgency as "high" | "medium" | "low";
}

function mapToActionItems(
	negotiations: NegotiationRequest[],
	projects: VendorProjectCardData[],
	leaderboard: { rank: number; isCurrentVendor: boolean }[],
): ActionItem[] {
	const items: ActionItem[] = [];

	for (const neg of negotiations) {
		const iterationsLeft = neg.maxIterations - neg.iterationNumber;
		const baseUrgency =
			neg.priority ?? (iterationsLeft <= 1 ? "high" : "medium");
		const urgency = calculateUrgency({
			type: "negotiation",
			urgency: baseUrgency,
		});

		items.push({
			id: `neg-${neg.projectId}`,
			type: "negotiation",
			urgency,
			title: neg.projectTitle,
			subtitle: neg.companyName,
			detail: neg.companyNote,
			actionLabel: "Respond",
			actionHref: "/vendor/deals",
		});
	}

	for (const proj of projects) {
		if (proj.procurementMethod !== "OPEN_BIDDING") continue;

		const deadline = new Date(proj.tenderDeadlineAt);
		const now = new Date();
		const daysLeft = Math.ceil(
			(deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		const baseUrgency =
			proj.priority ??
			(daysLeft <= 3 ? "high" : daysLeft <= 7 ? "medium" : "low");
		const urgency = calculateUrgency({
			type: "bid",
			urgency: baseUrgency,
			projectValue: proj.estimatedValue,
		});

		const rank = leaderboard.find((e) => e.isCurrentVendor)?.rank;

		items.push({
			id: `bid-${proj.id}`,
			type: "bid",
			urgency,
			title: proj.title,
			subtitle: formatRupiah(proj.estimatedValue),
			detail: rank ? `Rank ${rank} of ${leaderboard.length} vendors` : "",
			deadline: deadline.toLocaleDateString("en-US", { dateStyle: "medium" }),
			actionLabel: "Revise Bid",
			actionHref: "/vendor/opportunities",
		});
	}

	return items;
}

export function ActionRequiredCard({
	negotiations,
	projects,
	leaderboard,
	loading = false,
}: ActionRequiredCardProps) {
	const [filter, setFilter] = useState<UrgencyFilter>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number | "all">(5);

	const allItems = mapToActionItems(negotiations, projects, leaderboard);

	const filtered =
		filter === "all" ? allItems : allItems.filter((i) => i.urgency === filter);

	const totalPages =
		pageSize === "all" ? 1 : Math.ceil(filtered.length / pageSize);
	const paginatedItems =
		pageSize === "all"
			? filtered
			: filtered.slice((page - 1) * pageSize, page * pageSize);

	const counts = {
		all: allItems.length,
		urgent: allItems.filter((i) => i.urgency === "urgent").length,
		high: allItems.filter((i) => i.urgency === "high").length,
		medium: allItems.filter((i) => i.urgency === "medium").length,
		low: allItems.filter((i) => i.urgency === "low").length,
	};

	// One row frame; each slot is a real action or a shimmer.
	const rows: (ActionItem | null)[] = loading
		? Array.from({ length: 4 }, () => null)
		: paginatedItems;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Action Required</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Filter tabs */}
				<div className="mb-4 flex gap-2 border-b border-border pb-3">
					{loading
						? FILTERS.map((level) => (
								<ShimmerBlock key={level} className="h-8 w-20 rounded-lg" />
							))
						: FILTERS.map((level) => (
								<button
									key={level}
									type="button"
									onClick={() => {
										setFilter(level);
										setPage(1);
									}}
									className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
										filter === level
											? "bg-foreground/10 text-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									{level === "all"
										? "All"
										: level.charAt(0).toUpperCase() + level.slice(1)}
									{counts[level] > 0 && (
										<span className="ml-1.5 text-sm opacity-60">
											{counts[level]}
										</span>
									)}
								</button>
							))}
				</div>

				{/* Inbox list */}
				{!loading && paginatedItems.length === 0 ? (
					<EmptyState
						icon={<FontAwesomeIcon icon={faClock} />}
						title="Nothing needs your attention"
						description={
							filter === "all"
								? "Client negotiation requests and open-bid deadlines that need action appear here."
								: `No ${filter} items are waiting on you. Switch to All to see the rest of the inbox.`
						}
					/>
				) : (
					<div className="space-y-2">
						{rows.map((item, i) => (
							<div
								key={item?.id ?? i}
								className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										{item ? (
											<Badge
												variant="outline"
												className={URGENCY_STYLES[item.urgency]}
											>
												{item.type === "negotiation"
													? "Negotiation"
													: "Open Bid"}
											</Badge>
										) : (
											<ShimmerBlock className="h-5 w-24 rounded-md" />
										)}
										{item?.deadline ? (
											<span className="flex items-center gap-1 text-sm text-muted-foreground">
												<FontAwesomeIcon icon={faClock} className="text-sm" />
												{item.deadline}
											</span>
										) : !item ? (
											<ShimmerBlock className="h-4 w-28" />
										) : null}
									</div>
									{item ? (
										<h4 className="mt-1 truncate text-sm font-medium text-foreground">
											{item.title}
										</h4>
									) : (
										<ShimmerBlock className="mt-1 h-5 w-1/2" />
									)}
									{item ? (
										<p className="mt-0.5 truncate text-sm text-muted-foreground">
											{item.subtitle}
											{item.detail && ` • ${item.detail}`}
										</p>
									) : (
										<ShimmerBlock className="mt-0.5 h-4 w-2/3" />
									)}
								</div>
								{item ? (
									<Link to={item.actionHref}>
										<Button size="sm" variant="outline" className="shrink-0">
											{item.actionLabel}
										</Button>
									</Link>
								) : (
									<ShimmerBlock className="h-8 w-24 shrink-0 rounded-md" />
								)}
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				<div className="mt-4 flex items-center justify-between border-t border-border pt-4">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Show</span>
						{loading ? (
							<ShimmerBlock className="h-8 w-[70px] rounded-md" />
						) : (
							<Select
								value={String(pageSize)}
								onValueChange={(v) => {
									setPageSize(v === "all" ? "all" : Number(v));
									setPage(1);
								}}
							>
								<SelectTrigger className="h-8 w-[70px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">5</SelectItem>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="all">All</SelectItem>
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="flex items-center gap-2">
						{loading ? (
							<>
								<ShimmerBlock className="h-4 w-24" />
								<ShimmerBlock className="h-8 w-20 rounded-md" />
								<ShimmerBlock className="h-8 w-16 rounded-md" />
							</>
						) : (
							<>
								<span className="text-sm text-muted-foreground">
									{pageSize === "all"
										? `${filtered.length} items`
										: `${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
								>
									Next
								</Button>
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
