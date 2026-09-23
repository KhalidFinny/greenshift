import {
	faArrowDown,
	faArrowUp,
	faEquals,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api, type BusinessProjectSummary } from "@greenshift/core";
import {
	Badge,
	Button,
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
import { formatId } from "./lib/number-format";
import { formatSubmittedAt } from "./lib/project-display";

function inMonth(
	projects: BusinessProjectSummary[],
	offset: number,
	predicate: (p: BusinessProjectSummary) => boolean = () => true,
	now = new Date(),
): BusinessProjectSummary[] {
	const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
	return projects.filter((p) => {
		if (!p.submittedAt || !predicate(p)) return false;
		const s = new Date(p.submittedAt);
		return (
			s.getFullYear() === month.getFullYear() &&
			s.getMonth() === month.getMonth()
		);
	});
}

function signed(delta: number): string {
	return `${delta > 0 ? "+" : ""}${delta}`;
}

/** The badge follows the record, not the raw status: no submission date is a
 * draft, whatever stage the row carries. */
function StatusBadge({
	status,
	submittedAt,
}: {
	status: string;
	submittedAt: string | null;
}) {
	if (!submittedAt) {
		return (
			<Badge variant="secondary" className="bg-muted text-muted-foreground">
				Draft
			</Badge>
		);
	}
	if (status === "Verified") {
		return (
			<Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
				Verified
			</Badge>
		);
	}
	return (
		<Badge variant="secondary" className="bg-blue-50 text-blue-700">
			{status}
		</Badge>
	);
}

const columns: ColumnDef<BusinessProjectSummary>[] = [
	{
		id: "project",
		accessorFn: (p) => p.name,
		header: "Project",
		cell: ({ row }) => (
			<>
				<p className="font-medium">{row.original.name}</p>
				<p className="text-sm text-muted-foreground">
					{row.original.location ?? "—"}
					{row.original.sector ? ` · ${row.original.sector}` : ""}
				</p>
			</>
		),
	},
	{
		id: "submitted",
		accessorFn: (p) => p.submittedAt ?? "",
		header: "Submitted",
		cell: ({ row }) => formatSubmittedAt(row.original.submittedAt),
	},
	{
		id: "capex",
		accessorFn: (p) => p.capexRp ?? 0,
		header: "CAPEX",
		meta: { className: "tabular-nums" },
		cell: ({ row }) =>
			row.original.capexRp === null
				? "—"
				: `Rp ${formatId(row.original.capexRp)}`,
	},
	{
		id: "status",
		accessorFn: (p) => p.status,
		header: "Status",
		cell: ({ row }) => (
			<StatusBadge
				status={row.original.status}
				submittedAt={row.original.submittedAt}
			/>
		),
	},
];

export function BusinessDashboard() {
	const [statusFilter, setStatusFilter] = useState("all");
	const [sectorFilter, setSectorFilter] = useState("all");
	const projectsQuery = useQuery({
		queryKey: ["business", "projects"],
		queryFn: async () => (await api.business.projects({ limit: 50 })).projects,
	});
	const projects = projectsQuery.data ?? [];
	const loading = projectsQuery.isPending;

	const total = projects.length;
	// Registration and LVV verification are separate statuses; both read as "in review".
	const inReview = projects.filter(
		(p) =>
			p.status === "Register for LVV" ||
			p.status === "Awaiting LVV verification",
	).length;
	const verified = projects.filter((p) => p.status === "Verified").length;
	const capex = projects.reduce((s, p) => s + (p.capexRp ?? 0), 0);
	const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

	const thisMonth = inMonth(projects, 0).length;
	const lastMonth = inMonth(projects, 1).length;
	const inReviewThisMonth = inMonth(
		projects,
		0,
		(p) =>
			p.status === "Register for LVV" ||
			p.status === "Awaiting LVV verification",
	).length;
	const verifiedThisMonth = inMonth(
		projects,
		0,
		(p) => p.status === "Verified",
	).length;
	const capexThisMonth = inMonth(projects, 0).reduce(
		(s, p) => s + (p.capexRp ?? 0),
		0,
	);
	const capexLastMonth = inMonth(projects, 1).reduce(
		(s, p) => s + (p.capexRp ?? 0),
		0,
	);

	const rows = [...projects].sort((a, b) =>
		(b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
	);

	/** Options come off the loaded rows in table order, so a select can only
	 * offer a status or sector some project actually has. */
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
	const filteredRows = useMemo(
		() =>
			rows.filter(
				(project) =>
					(statusFilter === "all" || project.status === statusFilter) &&
					(sectorFilter === "all" || project.sector === sectorFilter),
			),
		[rows, statusFilter, sectorFilter],
	);

	const share = (n: number) =>
		total > 0 ? `${Math.round((n / total) * 100)}%` : "—";
	const capexDelta = capexThisMonth - capexLastMonth;

	return (
		<div className="space-y-6">
			{projectsQuery.isError ? (
				<div className="py-20">
					<EmptyState
						tone="error"
						title="Projects did not load"
						description="Could not reach the projects endpoint."
						action={
							<Button variant="outline" onClick={() => projectsQuery.refetch()}>
								Try again
							</Button>
						}
					/>
				</div>
			) : !loading && total === 0 ? (
				<div className="py-20">
					<EmptyState
						title="No projects yet"
						description="Submit your first energy transition project and it will appear here."
						action={
							<Button asChild>
								<Link to="/business/submit">Submit a Project</Link>
							</Button>
						}
					/>
				</div>
			) : (
				<>
					<div className="rounded-lg bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-8 lg:flex-row lg:gap-0">
							<div className="lg:flex-[1.4] lg:pr-8">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<p className="text-sm text-gray-500">Total CAPEX requested</p>
									<Badge
										variant="secondary"
										className={`gap-1 font-semibold ${
											capexDelta === 0
												? "bg-muted text-muted-foreground"
												: capexDelta > 0
													? "bg-emerald-50 text-emerald-700"
													: "bg-amber-50 text-amber-700"
										}`}
									>
										<FontAwesomeIcon
											icon={
												capexDelta === 0
													? faEquals
													: capexDelta > 0
														? faArrowUp
														: faArrowDown
											}
											className="size-2.5"
										/>
										Rp {formatId(Math.abs(capexDelta))} vs last month
									</Badge>
								</div>
								<p className="mt-3 text-4xl font-bold leading-tight tabular-nums">
									{loading ? (
										<ShimmerBlock className="h-10 w-72 max-w-full" />
									) : (
										`Rp ${formatId(capex)}`
									)}
								</p>
								<p className="mt-3 text-sm text-gray-500">
									{loading ? " " : `${verified} of ${total} projects verified`}
								</p>
								<div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
									<div
										className="h-full rounded-full bg-emerald-600 transition-all"
										style={{ width: `${verifiedPct}%` }}
										role="progressbar"
										aria-valuenow={verifiedPct}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label="Share of projects verified"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-8 lg:grid-cols-3 lg:items-stretch lg:gap-0 lg:border-t-0 lg:border-l lg:pt-0">
								{[
									{
										title: "Submitted",
										value: total,
										unit: "projects",
										comparison: `${thisMonth} this month`,
										delta: thisMonth - lastMonth,
										deltaLabel: "vs last month",
										upIsGood: true,
									},
									{
										title: "In review",
										value: inReview,
										unit: `of ${total}`,
										comparison: share(inReview),
										delta: inReviewThisMonth,
										deltaLabel: "new",
										upIsGood: false,
									},
									{
										title: "Verified",
										value: verified,
										unit: `of ${total}`,
										comparison: share(verified),
										delta: verifiedThisMonth,
										deltaLabel: "new",
										upIsGood: true,
									},
								].map((m, i) => (
									<div
										key={m.title}
										className={`flex flex-col gap-3 lg:h-full lg:justify-between lg:px-6 ${
											i > 0 ? "lg:border-l lg:border-gray-200" : ""
										}`}
									>
										<p className="text-sm font-medium text-gray-500">
											{m.title}
										</p>
										{loading ? (
											<ShimmerBlock className="h-12 w-28" />
										) : (
											<p className="flex flex-wrap items-baseline gap-x-2 text-5xl font-bold leading-none tabular-nums">
												{m.value}
												<span className="text-base font-normal text-gray-500">
													{m.unit}
												</span>
											</p>
										)}
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base">
											<span className="text-gray-500">{m.comparison}</span>
											<Badge
												variant="secondary"
												className={`gap-1 text-base font-semibold ${
													m.delta === 0
														? "bg-muted text-muted-foreground"
														: m.delta > 0 === m.upIsGood
															? "bg-emerald-50 text-emerald-700"
															: "bg-amber-50 text-amber-700"
												}`}
											>
												<FontAwesomeIcon
													icon={
														m.delta === 0
															? faEquals
															: m.delta > 0
																? faArrowUp
																: faArrowDown
													}
													className="size-2.5"
												/>
												{m.delta === 0 ? "no change" : signed(m.delta)}{" "}
												{m.deltaLabel}
											</Badge>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="rounded-lg bg-white p-4 shadow-sm">
						{/* The two filters sit above the table; the search box below them
						    is the table's own and narrows whatever they leave. */}
						<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
								disabled={rows.length === 0}
							>
								<SelectTrigger
									aria-label="Filter by status"
									className="w-full sm:w-[200px]"
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
								disabled={rows.length === 0}
							>
								<SelectTrigger
									aria-label="Filter by sector"
									className="w-full sm:w-[200px]"
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
						<DataTable
							columns={columns}
							data={loading ? [] : filteredRows}
							getRowId={(p) => String(p.id)}
							pageSize={10}
							searchPlaceholder="Search projects"
							emptyMessage={
								loading
									? undefined
									: rows.length > 0 && filteredRows.length === 0
										? "No project matches this search and these filters. Set Status and Sector back to All to see every project."
										: "No projects yet."
							}
							ariaLabel="Projects"
						/>
					</div>
				</>
			)}
		</div>
	);
}
