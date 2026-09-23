import {
	faCirclePlus,
	faDownload,
	faEye,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	api,
	type BusinessProjectSummary,
	publishToast,
} from "@greenshift/core";
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

export function MyProjects() {
	const [statusFilter, setStatusFilter] = useState("all");
	const [sectorFilter, setSectorFilter] = useState("all");

	const projectsQuery = useQuery({
		queryKey: ["business", "projects"],
		queryFn: async () => (await api.business.projects({ limit: 50 })).projects,
	});
	const projects = projectsQuery.data ?? [];

	/** Downloads the project's first document that has a download URL; the file sits
	 * behind the API, so a project with nothing ready says so instead. */
	async function downloadFirstDocument(projectId: number) {
		try {
			const { documents } = await api.business.documents(projectId);
			const ready = documents.find((document) => document.downloadUrl);
			if (!ready?.downloadUrl) {
				publishToast({
					tone: "error",
					message: "No document is ready to download for this project yet.",
				});
				return;
			}
			window.open(ready.downloadUrl, "_blank", "noopener");
		} catch {
			// The shared client already reported the failure as a toast.
		}
	}

	/** Options come off the loaded rows in list order, so a select can only offer
	 * a status or sector some project actually has. */
	const statusOptions = useMemo(
		() => [...new Set(projects.map((project) => project.status))],
		[projects],
	);

	const sectorOptions = useMemo(() => {
		const sectors = new Set<string>();
		for (const project of projects) {
			if (project.sector) sectors.add(project.sector);
		}
		return [...sectors];
	}, [projects]);

	const filteredProjects = useMemo(
		() =>
			projects.filter(
				(project) =>
					(statusFilter === "all" || project.status === statusFilter) &&
					(sectorFilter === "all" || project.sector === sectorFilter),
			),
		[projects, statusFilter, sectorFilter],
	);

	const columns = useMemo<ColumnDef<BusinessProjectSummary>[]>(
		() => [
			{
				id: "project",
				accessorFn: (project) => project.name,
				header: "Project",
				// Below `md` the Submitted and CAPEX columns fold into this cell, so it
				// may wrap rather than widen the table past its container.
				meta: { className: "max-md:whitespace-normal max-md:wrap-anywhere" },
				cell: ({ row }) => (
					<>
						<p className="font-medium">{row.original.name}</p>
						<p className="text-base text-muted-foreground">
							{row.original.location ?? "Location not filled in"}
							{row.original.sector ? ` · ${row.original.sector}` : ""}
						</p>
						<p className="text-base text-muted-foreground md:hidden">
							{foldedDetail(row.original)}
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
					// Stacked below `md`: three 44px targets in a column leave the other
					// columns room to read at 390px.
					<div className="flex flex-wrap items-center gap-2 max-md:flex-col">
						<Button
							variant="outline"
							size="sm"
							className="max-md:h-11 max-md:w-11 max-md:px-0"
							asChild
						>
							<Link
								to="/business/projects/$projectId"
								params={{ projectId: String(row.original.id) }}
							>
								<FontAwesomeIcon icon={faEye} />
								<span className="max-md:sr-only">View details</span>
							</Link>
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="max-md:h-11 max-md:w-11"
							aria-label={`Download a document for ${row.original.name}`}
							onClick={() => void downloadFirstDocument(row.original.id)}
						>
							<FontAwesomeIcon icon={faDownload} />
						</Button>
					</div>
				),
			},
		],
		[],
	);

	return (
		<div className="space-y-6">
			{/* The filters and the primary action are page controls, so they sit on the
			    background; the card holds only the table. */}
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
						value={sectorFilter}
						onValueChange={setSectorFilter}
						disabled={projects.length === 0}
					>
						<SelectTrigger
							aria-label="Filter by sector"
							className="w-full sm:w-[220px]"
						>
							<SelectValue placeholder="All sectors" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All sectors</SelectItem>
							{sectorOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button asChild className="w-full sm:w-auto">
					<Link to="/business/submit">
						<FontAwesomeIcon icon={faCirclePlus} />
						Submit a Project
					</Link>
				</Button>
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
							description="The list could not reach the projects endpoint. Try again to reload it."
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
							title="No projects yet"
							description="Projects you submit appear here with their status, so you can follow each one through verification."
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
							emptyMessage="No project matches these filters. Set Status and Sector back to All to see every project."
							ariaLabel="My projects"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
