import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BondListing } from "@greenshift/api/contracts";
import { api, PRIMARY_PARTNER } from "@greenshift/core";
import {
	Button,
	cn,
	EmptyState,
	PaginationBar,
	usePagedRows,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BondCard, BondCardSkeleton } from "../organisms/market-card";

type BondTab = "verified" | "on_progress";

interface ListingGridProps {
	listings: BondListing[];
	/** Data still in flight: the same two-column grid, shimmering cards. */
	loading: boolean;
	tab: BondTab;
	onSwitchTab: (tab: BondTab) => void;
}

function ListingGrid({
	listings,
	loading,
	tab,
	onSwitchTab,
}: ListingGridProps) {
	// The tab already narrowed the source, so the hook pages the filtered rows.
	const {
		pageRows,
		pageIndex,
		pageSize,
		pageCount,
		total,
		setPageIndex,
		setPageSize,
	} = usePagedRows(listings);

	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{Array.from({ length: 4 }, (_, index) => (
					<BondCardSkeleton key={index} />
				))}
			</div>
		);
	}

	if (listings.length === 0) {
		return tab === "verified" ? (
			<EmptyState
				title="No verified bonds listed"
				description="No project has cleared validation and partner issuance yet, so there is nothing to monitor here. Projects still under review sit on the In Progress tab."
				action={
					<Button variant="outline" onClick={() => onSwitchTab("on_progress")}>
						View projects in progress
					</Button>
				}
			/>
		) : (
			<EmptyState
				title="No projects under review"
				description="Every listed project has cleared validation, so nothing is waiting on review. Issued bonds sit on the Verified tab."
				action={
					<Button variant="outline" onClick={() => onSwitchTab("verified")}>
						View verified bonds
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{pageRows.map((listing) => (
					<BondCard key={listing.id} listing={listing} />
				))}
			</div>
			<PaginationBar
				label="Bond listings"
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				total={total}
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}

export function BondsPage() {
	const query = useQuery({
		queryKey: ["investor", "market"],
		queryFn: () => api.investor.market(),
	});
	const [tab, setTab] = useState<BondTab>("verified");

	const loading = query.isPending;
	const source = query.data?.bonds ?? [];

	const verified = source.filter((listing) => listing.status === "verified");
	const onProgress = source.filter(
		(listing) => listing.status === "on_progress",
	);
	const tabs: Array<{ value: BondTab; label: string; count: number }> = [
		{ value: "verified", label: "Verified", count: verified.length },
		{ value: "on_progress", label: "In Progress", count: onProgress.length },
	];

	return (
		<main className="pb-20">
			{/* Sticky command bar: back button stays reachable while the list scrolls. */}
			<div className="sticky top-0 z-30 border-b border-border/70 bg-background">
				<div className="page-wrap mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link to="/">
						<Button variant="outline" size="lg">
							Back to Home
						</Button>
					</Link>
					{loading ? null : (
						<span className="hidden text-sm text-muted-foreground sm:block">
							{source.length} bonds listed
						</span>
					)}
				</div>
			</div>

			<div className="page-wrap mx-auto max-w-7xl px-4 py-8 sm:px-6">
				<header className="max-w-3xl">
					<h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
						Green Bonds
					</h1>
					<p className="mt-3 text-base leading-relaxed text-muted-foreground">
						Every project GreenShift has taken to an issued bond, with the
						emission reductions it has measured and verified. The bond itself is
						issued and held by a licensed securities partner.
					</p>
				</header>

				<div className="mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
					<FontAwesomeIcon
						icon={faCircleInfo}
						className="mt-0.5 size-5 shrink-0 text-primary"
					/>
					<p className="text-sm leading-relaxed text-muted-foreground">
						<span className="font-medium text-foreground">
							{PRIMARY_PARTNER.name}
						</span>{" "}
						{PRIMARY_PARTNER.note} The buy button opens the partner app; if it
						is not installed we redirect you to Google Play, and you can always
						copy the bond code to search manually.
					</p>
				</div>

				<div className="mt-8 inline-flex flex-wrap gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
					{tabs.map((item) => (
						<button
							key={item.value}
							type="button"
							onClick={() => setTab(item.value)}
							className={cn(
								"rounded-md px-4 py-2 text-base font-medium transition-colors",
								tab === item.value
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{item.label}
							{loading ? null : ` (${item.count})`}
						</button>
					))}
				</div>

				<div className="mt-6">
					{query.isError ? (
						<EmptyState
							tone="error"
							title="Bond list did not load"
							description="GET /api/investor/market did not answer, so no listings could be retrieved."
							action={
								<Button variant="outline" onClick={() => query.refetch()}>
									Try again
								</Button>
							}
						/>
					) : (
						<ListingGrid
							listings={tab === "verified" ? verified : onProgress}
							loading={loading}
							tab={tab}
							onSwitchTab={setTab}
						/>
					)}
				</div>
			</div>
		</main>
	);
}
