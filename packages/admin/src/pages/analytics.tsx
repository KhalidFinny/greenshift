import {
	faArrowTrendUp,
	faChartLine,
	faCoins,
	faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import type { AdminProject, AdminStats } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Bar,
	BarChart,
	BarXAxis,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	DataTable,
	EmptyState,
	Grid,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { ExportSection } from "../lib/export";
import { formatMonth } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";
import { TableSkeleton } from "../organisms/table-skeleton";

const idr = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

type FundingRow = AdminStats["funding"][number];

/** Column labels for the loading frames, in table order. */
const FUNDING_HEADERS = ["Bond", "Budget", "Raised", "Progress"];
const PROJECT_HEADERS = [
	"Project",
	"Sector",
	"Status",
	"Budget",
	"Risk",
	"Blueprint",
];

const fundingColumns: ColumnDef<FundingRow>[] = [
	{
		id: "bond",
		accessorFn: (row) => row.title,
		header: "Bond",
		meta: { className: "font-medium" },
		cell: ({ row }) => row.original.title,
	},
	{
		id: "budget",
		accessorFn: (row) => row.budget ?? 0,
		header: "Budget",
		meta: { className: "tabular-nums" },
		cell: ({ row }) =>
			row.original.budget ? idr.format(row.original.budget) : "-",
	},
	{
		id: "raised",
		accessorFn: (row) => row.funded ?? 0,
		header: "Raised",
		meta: { className: "tabular-nums" },
		cell: ({ row }) => idr.format(row.original.funded ?? 0),
	},
	{
		id: "progress",
		accessorFn: (row) =>
			row.progress ?? (row.budget ? (row.funded ?? 0) / row.budget : 0),
		header: "Progress",
		meta: { className: "tabular-nums" },
		cell: ({ row }) => {
			const progress =
				row.original.progress ??
				(row.original.budget
					? (row.original.funded ?? 0) / row.original.budget
					: 0);
			return (
				<div className="flex items-center gap-3">
					<div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary"
							style={{ width: `${Math.round(progress * 100)}%` }}
						/>
					</div>
					{Math.round(progress * 100)}%
				</div>
			);
		},
	},
];

const projectColumns: ColumnDef<AdminProject>[] = [
	{
		id: "project",
		accessorFn: (row) => row.title,
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
		accessorFn: (row) => row.industrySector ?? "",
		header: "Sector",
		cell: ({ row }) => row.original.industrySector ?? "-",
	},
	{
		id: "status",
		accessorFn: (row) => row.status,
		header: "Status",
		cell: ({ row }) => (
			<Badge variant="secondary" className="text-base px-3 !h-8 rounded-md">
				{row.original.status}
			</Badge>
		),
	},
	{
		id: "budget",
		accessorFn: (row) => row.budget ?? 0,
		header: "Budget",
		meta: { className: "tabular-nums" },
		cell: ({ row }) =>
			row.original.budget ? idr.format(row.original.budget) : "-",
	},
	{
		id: "risk",
		accessorFn: (row) => row.riskScore ?? 0,
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
		accessorFn: (row) => row.blueprintStatus ?? "",
		header: "Blueprint",
		cell: ({ row }) =>
			row.original.blueprintStatus ? (
				<Badge variant="outline" className="text-base px-3 !h-8 rounded-md">
					{row.original.blueprintStatus}
				</Badge>
			) : (
				"-"
			),
	},
];

export function AdminAnalytics() {
	const statsQuery = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.admin.stats(),
	});
	const analyticsQuery = useQuery({
		queryKey: ["admin", "analytics"],
		queryFn: () => api.admin.analytics(),
	});
	const projectsQuery = useQuery({
		queryKey: ["admin", "projects", "analytics"],
		queryFn: () => api.admin.projects({ limit: 200 }),
	});

	if (statsQuery.isError || analyticsQuery.isError || projectsQuery.isError) {
		return (
			<EmptyState
				tone="error"
				title="Analytics data did not load"
				description="The console could not reach the stats, analytics, or project endpoints behind this page."
				action={
					<Button
						variant="outline"
						onClick={() => {
							void Promise.all([
								statsQuery.refetch(),
								analyticsQuery.refetch(),
								projectsQuery.refetch(),
							]);
						}}
					>
						Try again
					</Button>
				}
			/>
		);
	}

	// Each query keeps its cached data across a refetch, so each card shimmers only its own values.
	const loading =
		statsQuery.isPending || analyticsQuery.isPending || projectsQuery.isPending;

	const stats = statsQuery.data;
	const analytics = analyticsQuery.data;
	const projects = projectsQuery.data?.projects ?? [];

	const totalUsers = stats
		? Object.values(stats.users).reduce((a, b) => a + b, 0)
		: 0;
	const activeProjects = stats
		? (stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0)
		: 0;
	const totalProjects = stats
		? Object.values(stats.projects).reduce((a, b) => a + b, 0)
		: 0;
	// The same public bond data the public dashboard shows, aggregated here without any per-investor rows.
	const funding: FundingRow[] = stats?.funding ?? [];
	// Ranked by money raised, highest first: the table pages the whole field rather than hiding all but the top few.
	const rankedBonds: FundingRow[] = [...funding].sort(
		(a, b) => (b.funded ?? 0) - (a.funded ?? 0),
	);

	const bondFundingSections: ExportSection[] = [
		{
			title: "Bond Funding Status",
			headers: ["Bond", "Budget", "Raised", "Progress"],
			rows: rankedBonds.map((row) => [
				row.title,
				row.budget ? idr.format(row.budget) : "-",
				idr.format(row.funded ?? 0),
				`${Math.round((row.progress ?? (row.budget ? (row.funded ?? 0) / row.budget : 0)) * 100)}%`,
			]),
		},
	];

	const projectIntelligenceSections: ExportSection[] = [
		{
			title: "Project Intelligence",
			headers: [
				"Project",
				"Company",
				"Sector",
				"Status",
				"Budget",
				"Risk",
				"Blueprint",
			],
			rows: projects.map((row) => [
				row.title,
				row.companyName,
				row.industrySector ?? "-",
				row.status,
				row.budget ? idr.format(row.budget) : "-",
				String(row.riskScore ?? "-"),
				row.blueprintStatus ?? "-",
			]),
		},
	];

	const metricCards = [
		{
			label: "Total Investment",
			value: idr.format(stats?.investments.sum ?? 0),
			icon: faCoins,
			sub: `${stats?.investments.total ?? 0} bonds`,
		},
		{
			label: "ROI Paid",
			value: idr.format(stats?.investments.roiPaid ?? 0),
			icon: faChartLine,
			sub: "return distribution",
		},
		{
			label: "Active Projects",
			value: String(activeProjects),
			icon: faArrowTrendUp,
			sub: `${totalProjects} total projects`,
		},
		{
			label: "Users",
			value: String(totalUsers),
			icon: faLeaf,
			sub: `${stats?.companies ?? 0} organizations`,
		},
	];
	// Every series comes from the analytics endpoint: 12 trailing months, zero-filled, so the charts share one x-axis.
	const growthData = (analytics?.monthly ?? []).map((point) => ({
		label: formatMonth(point.month),
		users: point.users,
		organizations: point.organizations,
	}));
	const carbonData = (analytics?.monthly ?? []).map((point) => ({
		label: formatMonth(point.month),
		value: point.carbonReduction,
	}));
	const investmentData = (analytics?.monthly ?? []).map((point) => ({
		label: formatMonth(point.month),
		value: point.investments,
	}));
	const latest = analytics?.monthly.at(-1);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				{loading ? null : (
					<ExportMenu
						filename="analytics"
						title="Analytics"
						sections={[...bondFundingSections, ...projectIntelligenceSections]}
					/>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{metricCards.map((card) => (
					<MetricCard key={card.label} {...card} loading={loading} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Platform Growth</CardTitle>
						{loading ? (
							<ShimmerBlock className="h-6 w-20" />
						) : (
							<p className="text-lg font-semibold leading-none tabular-nums">
								{(latest?.users ?? 0) + (latest?.organizations ?? 0)}
							</p>
						)}
					</CardHeader>
					<CardContent className="pt-4">
						{loading ? (
							<ShimmerBlock className="aspect-[21/9] w-full" />
						) : (
							<BarChart data={growthData} xDataKey="label" aspectRatio="21 / 9">
								<Grid horizontal />
								<Bar dataKey="users" fill="var(--chart-1)" lineCap="round" />
								<Bar
									dataKey="organizations"
									fill="var(--chart-3)"
									lineCap="round"
								/>
								<BarXAxis />
								<ChartTooltip />
							</BarChart>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Carbon Impact</CardTitle>
						{loading ? (
							<ShimmerBlock className="h-6 w-24" />
						) : (
							<p className="text-lg font-semibold leading-none tabular-nums">
								{(latest?.carbonReduction ?? 0).toFixed(2)}{" "}
								<span className="text-base font-normal text-muted-foreground">
									tCO₂e
								</span>
							</p>
						)}
					</CardHeader>
					<CardContent className="pt-4">
						{loading ? (
							<ShimmerBlock className="aspect-[21/9] w-full" />
						) : (
							<BarChart data={carbonData} xDataKey="label" aspectRatio="21 / 9">
								<Grid horizontal />
								<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
								<BarXAxis />
								<ChartTooltip />
							</BarChart>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Investment Trends</CardTitle>
						{loading ? (
							<ShimmerBlock className="h-6 w-28" />
						) : (
							<p className="text-lg font-semibold leading-none tabular-nums">
								{idr.format(latest?.investments ?? 0)}
							</p>
						)}
					</CardHeader>
					<CardContent className="pt-4">
						{loading ? (
							<ShimmerBlock className="aspect-[21/9] w-full" />
						) : (
							<BarChart
								data={investmentData}
								xDataKey="label"
								aspectRatio="21 / 9"
							>
								<Grid horizontal />
								<Bar dataKey="value" fill="var(--chart-3)" lineCap="round" />
								<BarXAxis />
								<ChartTooltip />
							</BarChart>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Bond Funding Status</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<TableSkeleton headers={FUNDING_HEADERS} rows={6} />
						) : rankedBonds.length === 0 ? (
							<EmptyState
								title="No bond funding to report"
								description="No bond has been issued against a submitted project yet, so there is no funding progress to chart."
							/>
						) : (
							<DataTable
								columns={fundingColumns}
								data={rankedBonds}
								getRowId={(row) => String(row.id)}
								ariaLabel="Bond funding status"
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Project Intelligence</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<TableSkeleton headers={PROJECT_HEADERS} rows={6} />
						) : projects.length === 0 ? (
							<EmptyState
								title="No projects submitted"
								description="No company has submitted a project for assessment yet, so there is no risk or blueprint data to rank."
							/>
						) : (
							<DataTable
								columns={projectColumns}
								data={projects}
								getRowId={(row) => String(row.id)}
								ariaLabel="Project intelligence"
							/>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
