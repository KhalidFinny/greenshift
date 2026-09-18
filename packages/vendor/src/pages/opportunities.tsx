import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@greenshift/core";
import {
	Button,
	Card,
	CardContent,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useVendorData } from "../lib/use-vendor-data";
import { VendorProjectCard } from "../organisms/vendor-project-card";

type ProcurementFilter =
	| "ALL"
	| "OPEN_BIDDING"
	| "CLOSED_BIDDING"
	| "DIRECT_SELECTION";

export function VendorOpportunitiesPage() {
	const { user } = useAuth();
	const { projects, toggleSaveProject, proposals } = useVendorData();
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
	const recommended = availableProjects.filter(
		(p) => p.matchmaking.overallMatch >= 90,
	);
	const saved = availableProjects.filter((p) => p.isSaved);

	const methodPills: { label: string; value: ProcurementFilter }[] = [
		{ label: "All Tenders", value: "ALL" },
		{ label: "Open Bidding", value: "OPEN_BIDDING" },
		{ label: "Closed Bidding", value: "CLOSED_BIDDING" },
		{ label: "Direct Selection", value: "DIRECT_SELECTION" },
	];

	return (
		<div className="space-y-6">
			{/* Search & Procurement Filter Bar */}
			<div className="space-y-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<FontAwesomeIcon
							icon={faSearch}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
						/>
						<Input
							placeholder="Search open tenders by title, client company, or industrial sector..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSearchQuery("")}
							className="text-xs"
						>
							Clear Search
						</Button>
					)}
				</div>

				{/* Quick Method Filters */}
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">
						Method:
					</span>
					{methodPills.map((pill) => {
						const isSelected = selectedMethod === pill.value;
						return (
							<Button
								key={pill.value}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedMethod(pill.value)}
								className={`h-7 px-3 text-xs ${
									isSelected
										? "bg-[#03442C] text-white hover:bg-[#03442C]/90"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{pill.label}
							</Button>
						);
					})}
				</div>

				{selectedMethod === "DIRECT_SELECTION" && (
					<p className="text-xs text-purple-600 dark:text-purple-400">
						ℹ️ Direct Selection projects are private invitations — only visible
						if you've been invited by the company.
					</p>
				)}
			</div>

			<Tabs defaultValue="available">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="available">
						Available Tenders ({availableProjects.length})
					</TabsTrigger>
					<TabsTrigger value="recommended">
						Recommended ({recommended.length})
					</TabsTrigger>
					<TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
				</TabsList>

				{/* 1. Available Tenders Tab */}
				<TabsContent value="available" className="mt-6 space-y-4">
					<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
						<span>
							Showing unapplied tender opportunities. Already submitted a
							proposal?
						</span>
						<Link
							to="/vendor/deals"
							className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
						>
							Track in My Deals →
						</Link>
					</div>

					{availableProjects.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground">
								No available open tenders match your current search or filters.
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{availableProjects.map((proj) => (
								<VendorProjectCard
									key={proj.id}
									project={proj}
									onSave={toggleSaveProject}
								/>
							))}
						</div>
					)}
				</TabsContent>

				{/* 2. Recommended Tab */}
				<TabsContent value="recommended" className="mt-6 space-y-4">
					{recommended.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground">
								No recommended tenders match your current criteria. Try
								adjusting your search query or filters.
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{recommended.map((proj) => (
								<VendorProjectCard
									key={proj.id}
									project={proj}
									onSave={toggleSaveProject}
									variant="recommended"
								/>
							))}
						</div>
					)}
				</TabsContent>

				{/* 3. Saved Tab */}
				<TabsContent value="saved" className="mt-6 space-y-4">
					{saved.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground">
								No saved projects yet. Bookmark projects using the bookmark icon
								on any project card to review them here.
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{saved.map((proj) => (
								<VendorProjectCard
									key={proj.id}
									project={proj}
									onSave={toggleSaveProject}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
