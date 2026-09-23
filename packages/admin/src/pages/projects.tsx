import {
	faArrowTrendUp,
	faBuilding,
	faClipboardCheck,
	faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";
import type { AdminProject } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DataTable,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import type { ExportSection } from "../lib/export";
import {
	BLUEPRINT_STATUS_BADGE,
	BLUEPRINT_STATUS_LABELS,
	PROJECT_STATUS_BADGE,
	PROJECT_STATUS_LABELS,
	PROJECT_STATUS_OPTIONS,
} from "../lib/project-status";
import { ExportMenu } from "../molecules/export-menu";
import { MetricCard } from "../molecules/metric-card";
import { ProjectDetailDialog } from "../organisms/project-detail-dialog";
import { TableSkeleton } from "../organisms/table-skeleton";

/** Column labels for the loading frame, in table order. */
const PROJECT_HEADERS = [
	"Project",
	"Sector",
	"Status",
	"Budget",
	"Risk",
	"Blueprint",
	"Actions",
];

const idr = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const projectColumns = (
	onSelect: (project: AdminProject) => void,
): ColumnDef<AdminProject>[] => [
	{
		id: "project",
		accessorFn: (project) => project.title,
		header: "Project",
		cell: ({ row }) => (
			<>
				<p className="font-medium">{row.original.title}</p>
				<p className="text-muted-foreground">{row.original.companyName}</p>
			</>
		),
	},
	{
		id: "sector",
		accessorFn: (project) => project.industrySector ?? "",
		header: "Sector",
		cell: ({ row }) => row.original.industrySector ?? "-",
	},
	{
		id: "status",
		accessorFn: (project) => project.status,
		header: "Status",
		cell: ({ row }) => (
			<Badge
				variant={PROJECT_STATUS_BADGE[row.original.status] ?? "outline"}
				className="text-base px-3 !h-8 rounded-md"
			>
				{PROJECT_STATUS_LABELS[row.original.status] ?? row.original.status}
			</Badge>
		),
	},
	{
		id: "budget",
		accessorFn: (project) => project.budget ?? 0,
		header: "Budget",
		meta: { className: "tabular-nums" },
		cell: ({ row }) =>
			row.original.budget ? idr.format(row.original.budget) : "-",
	},
	{
		id: "risk",
		accessorFn: (project) => project.riskScore ?? 0,
		header: "Risk",
		meta: { className: "tabular-nums" },
		cell: ({ row }) => {
			const riskColor =
				(row.original.riskScore ?? 0) >= 70
					? "text-primary"
					: (row.original.riskScore ?? 0) >= 50
						? "text-muted-foreground"
						: "text-destructive";
			return <span className={riskColor}>{row.original.riskScore ?? "-"}</span>;
		},
	},
	{
		id: "blueprint",
		accessorFn: (project) => project.blueprintStatus ?? "",
		header: "Blueprint",
		cell: ({ row }) =>
			row.original.blueprintStatus ? (
				<Badge
					variant={
						BLUEPRINT_STATUS_BADGE[row.original.blueprintStatus] ?? "outline"
					}
					className="text-base px-3 !h-8 rounded-md"
				>
					{BLUEPRINT_STATUS_LABELS[row.original.blueprintStatus] ??
						row.original.blueprintStatus}
				</Badge>
			) : (
				"-"
			),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => (
			<Button variant="outline" onClick={() => onSelect(row.original)}>
				Detail
			</Button>
		),
	},
];

export function AdminProjects() {
	const [status, setStatus] = useState<string>("all");
	const [selected, setSelected] = useState<AdminProject | null>(null);
	const queryClient = useQueryClient();

	const projectsQuery = useQuery({
		queryKey: ["admin", "projects", status],
		queryFn: () =>
			api.admin.projects(
				status === "all" ? { limit: 200 } : { status, limit: 200 },
			),
	});
	const statsQuery = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.admin.stats(),
	});

	// Keep the sheet's project in sync with fresh list data, so a status change or a filter that moves the row out of view still reflects.
	const freshSelected = projectsQuery.data?.projects.find(
		(p) => p.id === selected?.id,
	);
	if (selected && freshSelected && freshSelected !== selected) {
		setSelected(freshSelected);
	}

	const handleMutated = (patch: Partial<AdminProject>) => {
		setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
		queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "blueprints"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
	};

	if (projectsQuery.isError || statsQuery.isError) {
		return (
			<EmptyState
				tone="error"
				title="Projects did not load"
				description="The admin project and stats endpoints did not answer, so the project lifecycle could not be read."
				action={
					<Button
						variant="outline"
						onClick={() => {
							void Promise.all([projectsQuery.refetch(), statsQuery.refetch()]);
						}}
					>
						Try again
					</Button>
				}
			/>
		);
	}

	// Cached project rows survive a refetch, so each part shimmers only its own values.
	const loading = projectsQuery.isPending || statsQuery.isPending;

	const stats = statsQuery.data;
	const projects = projectsQuery.data?.projects ?? [];
	const activeProjects = stats
		? (stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0)
		: 0;
	const totalProjects = stats
		? Object.values(stats.projects).reduce((a, b) => a + b, 0)
		: 0;
	const completedProjects = stats?.projects.completed ?? 0;
	const avgRisk =
		projects.length > 0
			? Math.round(
					projects.reduce((sum, p) => sum + (p.riskScore ?? 0), 0) /
						projects.length,
				)
			: 0;

	const projectExportSections: ExportSection[] = [
		{
			title: "Project List",
			headers: [
				"Project",
				"Company",
				"Sector",
				"Status",
				"Budget",
				"Risk",
				"Blueprint",
			],
			rows: projects.map((project) => [
				project.title,
				project.companyName,
				project.industrySector ?? "-",
				PROJECT_STATUS_LABELS[project.status] ?? project.status,
				project.budget ? idr.format(project.budget) : "-",
				String(project.riskScore ?? "-"),
				project.blueprintStatus
					? (BLUEPRINT_STATUS_LABELS[project.blueprintStatus] ??
						project.blueprintStatus)
					: "-",
			]),
		},
	];

	const columns = projectColumns((project) => setSelected(project));

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				{loading ? null : (
					<ExportMenu
						filename="projects"
						title="Projects"
						sections={projectExportSections}
					/>
				)}
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{
						label: "Total Projects",
						value: String(totalProjects),
						icon: faBuilding,
						sub: "entire pipeline",
					},
					{
						label: "Active Projects",
						value: String(activeProjects),
						icon: faArrowTrendUp,
						sub: "funding + monitoring",
					},
					{
						label: "Completed",
						value: String(completedProjects),
						icon: faClipboardCheck,
						sub: "closed-loop projects",
					},
					{
						label: "Avg Risk",
						value: String(avgRisk),
						icon: faGaugeHigh,
						sub: "average risk score",
					},
				].map((card) => (
					<MetricCard
						key={card.label}
						label={card.label}
						value={card.value}
						sub={card.sub}
						icon={card.icon}
						loading={loading}
					/>
				))}
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<CardTitle className="text-xl">Project List</CardTitle>
						<Select value={status} onValueChange={(value) => setStatus(value)}>
							<SelectTrigger className="w-full sm:w-[220px]">
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								{PROJECT_STATUS_OPTIONS.map((option) => (
									<SelectItem key={option} value={option}>
										{PROJECT_STATUS_LABELS[option]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<TableSkeleton headers={PROJECT_HEADERS} search rows={5} />
					) : projects.length === 0 ? (
						<EmptyState
							title="No projects in this stage"
							description={
								status === "all"
									? "No company has submitted a project to the platform yet."
									: `No project currently sits in the ${PROJECT_STATUS_LABELS[status] ?? status} stage. Clear the filter to see the whole pipeline.`
							}
							action={
								status === "all" ? undefined : (
									<Button variant="outline" onClick={() => setStatus("all")}>
										Show all statuses
									</Button>
								)
							}
						/>
					) : (
						<DataTable
							columns={columns}
							data={projects}
							getRowId={(project) => String(project.id)}
							ariaLabel="Project list"
							searchPlaceholder="Search projects"
							emptyMessage="No projects match your search."
						/>
					)}
				</CardContent>
			</Card>

			<ProjectDetailDialog
				project={selected}
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
				onMutated={handleMutated}
			/>
		</div>
	);
}
