import { faArrowLeft, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BondListing } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { Button, ContentSkeleton, cn, EmptyState } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PRIMARY_BROKER } from "../lib/broker-platforms";
import { DEMO_OBLIGASI } from "../lib/demo-data";
import { BondCard } from "../organisms/market-card";

type BondTab = "verified" | "on_progress";

function ListingGrid({ listings }: { listings: BondListing[] }) {
	if (listings.length === 0) {
		return (
			<EmptyState
				title="No bonds yet"
				description="There are no bonds in this category yet."
			/>
		);
	}
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{listings.map((listing) => (
				<BondCard key={listing.id} listing={listing} />
			))}
		</div>
	);
}

export function BondsPage() {
	const query = useQuery({
		queryKey: ["investor", "market"],
		queryFn: () => api.investor.market(),
	});
	const [tab, setTab] = useState<BondTab>("verified");

	const live = query.data?.bonds ?? [];
	const source = query.isSuccess
		? live.length > 0
			? live
			: DEMO_OBLIGASI
		: [];

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
			<div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
				<div className="page-wrap mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link to="/">
						<Button variant="outline" size="lg">
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to Home
						</Button>
					</Link>
					<span className="hidden text-sm text-muted-foreground sm:block">
						{source.length} bonds listed
					</span>
				</div>
			</div>

			<div className="page-wrap mx-auto max-w-7xl px-4 py-8 sm:px-6">
				<header className="max-w-3xl">
					<h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
						Green Bonds
					</h1>
				</header>

				<div className="mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
					<FontAwesomeIcon
						icon={faCircleInfo}
						className="mt-0.5 size-5 shrink-0 text-primary"
					/>
					<p className="text-sm leading-relaxed text-muted-foreground">
						<span className="font-medium text-foreground">
							{PRIMARY_BROKER.name}
						</span>{" "}
						{PRIMARY_BROKER.note} The buy button opens the broker app; if it is
						not installed we redirect you to Google Play, and you can always
						copy the bond code to search manually.
					</p>
				</div>

				{query.isPending ? (
					<div className="mt-8">
						<ContentSkeleton />
					</div>
				) : query.isError ? (
					<div className="mt-8">
						<EmptyState
							title="Failed to load bonds"
							description="Unable to fetch the bond list right now."
						/>
					</div>
				) : (
					<>
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
									{item.label} ({item.count})
								</button>
							))}
						</div>

						<div className="mt-6">
							<ListingGrid
								listings={tab === "verified" ? verified : onProgress}
							/>
						</div>
					</>
				)}
			</div>
		</main>
	);
}
