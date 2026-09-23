import {
	faCircleCheck,
	faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api, type BusinessMatchmakingProject } from "@greenshift/core";
import {
	Button,
	Card,
	CardContent,
	DataTable,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
	foldedDetail,
	formatRupiah,
	formatSubmittedAt,
	STATUS_PILL,
} from "../lib/project-display";

const VENDOR_FILTERS = [
	{ value: "chosen", label: "Vendor chosen" },
	{ value: "unchosen", label: "No vendor yet" },
] as const;

/** Past matchmaking: bidding closed means the route is chosen and the terms are
 * frozen, so the proposals are the page with the work left in it. */
function decided(project: BusinessMatchmakingProject): boolean {
	return (
		project.tenderStatus === "evaluation" ||
		project.tenderStatus === "closed" ||
		project.tenderStatus === "awarded"
	);
}

export function MatchmakingList() {
	const [statusFilter, setStatusFilter] = useState("all");
	const [vendorFilter, setVendorFilter] = useState("all");

	const projectsQuery = useQuery({
		queryKey: ["business", "matchmaking"],
		queryFn: async () =>
			(await api.business.matchmaking({ limit: 50 })).projects,
	});
	const projects = projectsQuery.data ?? [];

	const statusOptions = useMemo(
		() => [...new Set(projects.map((project) => project.status))],
		[projects],
	);

	const filteredProjects = useMemo(
		() =>
			projects.filter((project) => {
				if (statusFilter !== "all" && project.status !== statusFilter) {
					return false;
				}
				if (vendorFilter === "chosen") return project.awardedVendor !== null;
				if (vendorFilter === "unchosen") return project.awardedVendor === null;
				return true;
			}),
		[projects, statusFilter, vendorFilter],
	);

	const columns = useMemo<ColumnDef<BusinessMatchmakingProject>[]>(
		() => [
			{
				id: "project",
				// The vendor is part of the search, so typing a company name finds its project.
				accessorFn: (project) =>
					`${project.name} ${project.location ?? ""} ${project.sector ?? ""} ${
						project.awardedVendor ?? ""
					}`,
				header: "Project",
				// The chosen vendor and, below `md`, the Submitted and CAPEX columns fold
				// into this cell, so it may wrap rather than widen the table past its container.
				meta: { className: "max-md:whitespace-normal max-md:wrap-anywhere" },
				cell: ({ row }) => (
					<>
						<p className="font-medium">{row.original.name}</p>
						<p className="text-base text-muted-foreground">
							{row.original.location ?? "Location not filled in"}
							{row.original.sector ? ` · ${row.original.sector}` : ""}
						</p>
						<p className="mt-1 flex items-center gap-2 text-base max-md:hidden">
							{row.original.awardedVendor === null ? (
								<span className="text-muted-foreground">No vendor yet</span>
							) : (
								<>
									<span className="text-muted-foreground">Vendor</span>
									<span className="font-medium">
										{row.original.awardedVendor}
									</span>
									<FontAwesomeIcon
										icon={faCircleCheck}
										className="text-primary"
										aria-label="Vendor chosen"
									/>
								</>
							)}
						</p>
						<p className="text-base text-muted-foreground md:hidden">
							{row.original.status} · {foldedDetail(row.original)}
						</p>
					</>
				),
			},
			{
				id: "submitted",
				accessorFn: (project) => project.submittedAt ?? "",
				header: "Submitted",
				meta: { className: "max-md:hidden", headClassName: "max-md:hidden" },
				cell: ({ row }) => formatSubmittedAt(row.original.submittedAt),
			},
			{
				id: "capex",
				accessorFn: (project) => project.capexRp ?? 0,
				header: "CAPEX",
				meta: {
					className: "tabular-nums max-md:hidden",
					headClassName: "max-md:hidden",
				},
				cell: ({ row }) => formatRupiah(row.original.capexRp),
			},
			{
				id: "status",
				accessorFn: (project) => project.status,
				header: "Status",
				// On phones the project cell carries the status, so this column would only take width.
				meta: { className: "max-md:hidden", headClassName: "max-md:hidden" },
				cell: ({ row }) => (
					<span
						className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
							STATUS_PILL[row.original.status] ?? "bg-muted text-foreground"
						}`}
					>
						{row.original.status}
					</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => (
					// Below `md` the button is its icon alone behind a 44px target: the label
					// would squeeze the project cell, and the aria-label keeps it nameable.
					<div className="flex flex-wrap items-center gap-2">
						{decided(row.original) ? (
							// Past bidding, matchmaking is settled: the page that matters holds the proposals.
							<Button
								variant="outline"
								asChild
								className="max-md:size-11 max-md:px-0"
							>
								<Link
									to="/business/matchmaking/$projectId/bidding"
									params={{ projectId: String(row.original.id) }}
									aria-label={`Vendor proposals for ${row.original.name}`}
								>
									<span className="max-md:sr-only">Vendor proposals</span>
								</Link>
							</Button>
						) : (
							<Button asChild className="max-md:size-11 max-md:px-0">
								<Link
									to="/business/matchmaking/$projectId"
									params={{ projectId: String(row.original.id) }}
									aria-label={`Search vendors for ${row.original.name}`}
								>
									<FontAwesomeIcon icon={faMagnifyingGlass} />
									<span className="max-md:sr-only">Search vendors</span>
								</Link>
							</Button>
						)}
					</div>
				),
			},
		],
		[],
	);

	return (
		<div className="space-y-6">
			{/* No page title: the shell names the section, and the table is the page. */}

			{/* The filters are page controls, so they sit on the background; the card holds only the
			    table. */}
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
				<Select
					value={statusFilter}
					onValueChange={setStatusFilter}
					disabled={projects.length === 0}
				>
					<SelectTrigger
						aria-label="Filter by status"
						className="w-full sm:w-[220px]"
					>
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{statusOptions.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={vendorFilter}
					onValueChange={setVendorFilter}
					disabled={projects.length === 0}
				>
					<SelectTrigger
						aria-label="Filter by vendor"
						className="w-full sm:w-[220px]"
					>
						<SelectValue placeholder="All vendors" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All vendors</SelectItem>
						{VENDOR_FILTERS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardContent>
					{projectsQuery.isPending ? (
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, index) => (
								<ShimmerBlock key={index} className="h-14 w-full rounded-lg" />
							))}
						</div>
					) : projectsQuery.isError ? (
						<EmptyState
							tone="error"
							title="Your projects did not load"
							description="The list could not reach the matchmaking endpoint. Try again to reload it."
							action={
								<Button
									variant="outline"
									onClick={() => projectsQuery.refetch()}
								>
									Try again
								</Button>
							}
						/>
					) : projects.length === 0 ? (
						<EmptyState
							title="No projects to match yet"
							description="Projects you submit appear here once they leave the draft, so you can pick a vendor for each one."
							action={
								<Button asChild>
									<Link to="/business/submit">Submit a Project</Link>
								</Button>
							}
						/>
					) : (
						<DataTable
							columns={columns}
							data={filteredProjects}
							getRowId={(project) => String(project.id)}
							pageSize={10}
							searchPlaceholder="Search your projects"
							emptyMessage="No project matches this search and these filters. Set Status and Vendor back to All to see every project."
							ariaLabel="Projects available for vendor matchmaking"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
