import { faSearch, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@greenshift/core";
import {
	Button,
	EmptyState,
	Input,
	PaginationBar,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	usePagedRows,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { isTopMatch } from "../lib/matchmaking";
import { useVendorData } from "../lib/use-vendor-data";
import { VendorProjectCard } from "../organisms/vendor-project-card";

type ProcurementFilter =
	| "ALL"
	| "OPEN_BIDDING"
	| "CLOSED_BIDDING"
	| "DIRECT_SELECTION";

/** Card frames rendered while the tender list is still in flight. */
const LOADING_SLOTS = Array.from({ length: 6 }, () => null);

export function VendorOpportunitiesPage() {
	const { user } = useAuth();
	const { isLoading, projects, toggleSaveProject, proposals } = useVendorData();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMethod, setSelectedMethod] =
		useState<ProcurementFilter>("ALL");

	// Project IDs the vendor has already applied to
	const appliedProjectIds = new Set(proposals.map((p) => p.projectId));
	const currentVendorId = user ? String(user.id) : undefined;

	// Available projects = unapplied open tenders matching search & filters
	const availableProjects = projects.filter((p) => {
		// Do not show already-applied projects in Opportunities (tracked in My Deals)
		if (appliedProjectIds.has(p.id)) {
			return false;
		}

		// DIRECT_SELECTION: only visible to the invited vendor
		if (
			p.procurementMethod === "DIRECT_SELECTION" &&
			p.invitedVendorId !== currentVendorId
		) {
			return false;
		}

		const matchesQuery =
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.industrySector.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesMethod =
			selectedMethod === "ALL" || p.procurementMethod === selectedMethod;
		return matchesQuery && matchesMethod;
	});

	// Recommended = high match (≥90) among available unapplied tenders
	const recommended = availableProjects.filter((p) =>
		isTopMatch(p.matchmaking),
	);
	const saved = availableProjects.filter((p) => p.isSaved);

	// Each tab is its own list, so each pages the rows it renders.
	const availablePage = usePagedRows(availableProjects);
	const recommendedPage = usePagedRows(recommended);
	const savedPage = usePagedRows(saved);

	const methodPills: { label: string; value: ProcurementFilter }[] = [
		{ label: "All Tenders", value: "ALL" },
		{ label: "Open Bidding", value: "OPEN_BIDDING" },
		{ label: "Closed Bidding", value: "CLOSED_BIDDING" },
		{ label: "Direct Selection", value: "DIRECT_SELECTION" },
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex flex-wrap items-center gap-2">
					{methodPills.map((pill) => {
						const isSelected = selectedMethod === pill.value;
						return (
							<Button
								key={pill.value}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedMethod(pill.value)}
								className={`h-8 px-3 text-sm ${
									isSelected
										? "bg-[#00712D] text-white hover:bg-[#00712D]/90"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{pill.label}
							</Button>
						);
					})}
				</div>

				<div className="relative ml-auto w-64">
					<FontAwesomeIcon
						icon={faSearch}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
					/>
					<Input
						placeholder="Search tenders..."
						className="h-8 pl-8 text-sm"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Clear search"
							onClick={() => setSearchQuery("")}
							className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<FontAwesomeIcon icon={faX} />
						</Button>
					)}
				</div>
			</div>

			{selectedMethod === "DIRECT_SELECTION" && (
				<p className="text-sm text-purple-600">
					Direct Selection projects are private invitations. Only visible if
					you've been invited by the company.
				</p>
			)}

			<Tabs defaultValue="available">
				<TabsList className="flex w-full overflow-x-auto *:shrink-0 *:whitespace-nowrap sm:grid sm:grid-cols-3">
					<TabsTrigger value="available">
						Available Tenders ({availableProjects.length})
					</TabsTrigger>
					<TabsTrigger value="recommended">
						Recommended ({recommended.length})
					</TabsTrigger>
					<TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="available" className="mt-6 space-y-4">
					<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
						<span>
							Showing unapplied tender opportunities. Already submitted a
							proposal?
						</span>
						<Link
							to="/vendor/deals"
							className="font-semibold text-emerald-700 hover:underline"
						>
							Track in My Deals
						</Link>
					</div>

					{!isLoading && availableProjects.length === 0 ? (
						<EmptyState
							title="No tenders match"
							description="No available tenders match your current search or filters."
						/>
					) : (
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{(isLoading ? LOADING_SLOTS : availablePage.pageRows).map(
									(proj, i) => (
										<VendorProjectCard
											key={proj?.id ?? i}
											project={proj ?? undefined}
											onSave={toggleSaveProject}
										/>
									),
								)}
							</div>
							<PaginationBar
								label="Available tenders"
								pageIndex={availablePage.pageIndex}
								pageSize={availablePage.pageSize}
								pageCount={availablePage.pageCount}
								total={availablePage.total}
								onPageIndexChange={availablePage.setPageIndex}
								onPageSizeChange={availablePage.setPageSize}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="recommended" className="mt-6 space-y-4">
					{!isLoading && recommended.length === 0 ? (
						<EmptyState
							title="No strong matches"
							description="No recommended tenders match your current criteria. Try adjusting your search or filters."
						/>
					) : (
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{(isLoading ? LOADING_SLOTS : recommendedPage.pageRows).map(
									(proj, i) => (
										<VendorProjectCard
											key={proj?.id ?? i}
											project={proj ?? undefined}
											onSave={toggleSaveProject}
											variant="recommended"
										/>
									),
								)}
							</div>
							<PaginationBar
								label="Recommended tenders"
								pageIndex={recommendedPage.pageIndex}
								pageSize={recommendedPage.pageSize}
								pageCount={recommendedPage.pageCount}
								total={recommendedPage.total}
								onPageIndexChange={recommendedPage.setPageIndex}
								onPageSizeChange={recommendedPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="saved" className="mt-6 space-y-4">
					{!isLoading && saved.length === 0 ? (
						<EmptyState
							title="No saved tenders"
							description="Bookmark a tender from any card to shortlist it here."
						/>
					) : (
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{(isLoading ? LOADING_SLOTS : savedPage.pageRows).map(
									(proj, i) => (
										<VendorProjectCard
											key={proj?.id ?? i}
											project={proj ?? undefined}
											onSave={toggleSaveProject}
										/>
									),
								)}
							</div>
							<PaginationBar
								label="Saved tenders"
								pageIndex={savedPage.pageIndex}
								pageSize={savedPage.pageSize}
								pageCount={savedPage.pageCount}
								total={savedPage.total}
								onPageIndexChange={savedPage.setPageIndex}
								onPageSizeChange={savedPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
