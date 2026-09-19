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
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	ContentSkeleton,
	DataTable,
	EmptyState,
	Grid,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { ExportSection } from "../lib/export";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";

const idr = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const GROWTH_DATA = [
	{ label: "Jan", users: 4, organizations: 2 },
	{ label: "Feb", users: 6, organizations: 3 },
	{ label: "Mar", users: 7, organizations: 4 },
	{ label: "Apr", users: 9, organizations: 5 },
	{ label: "May", users: 12, organizations: 6 },
	{ label: "Jun", users: 14, organizations: 7 },
	{ label: "Jul", users: 18, organizations: 9 },
	{ label: "Aug", users: 21, organizations: 11 },
];

const CARBON_TREND = [
	{ label: "Jan", value: 8 },
	{ label: "Feb", value: 12 },
	{ label: "Mar", value: 16 },
	{ label: "Apr", value: 21 },
	{ label: "May", value: 28 },
	{ label: "Jun", value: 34 },
	{ label: "Jul", value: 41 },
	{ label: "Aug", value: 49.77 },
];

const INVESTMENT_TREND = [
	{ label: "Jan", value: 120_000_000 },
	{ label: "Feb", value: 180_000_000 },
	{ label: "Mar", value: 260_000_000 },
	{ label: "Apr", value: 390_000_000 },
	{ label: "May", value: 560_000_000 },
	{ label: "Jun", value: 920_000_000 },
	{ label: "Jul", value: 1_600_000_000 },
	{ label: "Aug", value: 2_500_000_000 },
];

type FundingRow = AdminStats["funding"][number];

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
	const projectsQuery = useQuery({
		queryKey: ["admin", "projects", "analytics"],
		queryFn: () => api.admin.projects({ limit: 200 }),
	});

	if (statsQuery.isPending || projectsQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (statsQuery.isError || projectsQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Failed to load analytics"
					description="Unable to retrieve platform performance data."
				/>
			</div>
		);
	}

	const stats = statsQuery.data;
	const projects = projectsQuery.data.projects;

	const totalUsers = Object.values(stats.users).reduce((a, b) => a + b, 0);
	const activeProjects =
		(stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0);
	// Bond funding status: the same public bond data surfaced on the
	// public dashboard, aggregated here for admin without any per-investor rows.
	const topBonds: FundingRow[] =
		stats.funding && stats.funding.length > 0
			? [...stats.funding]
					.sort((a, b) => (b.funded ?? 0) - (a.funded ?? 0))
					.slice(0, 6)
			: [
					{
						id: 1,
						title: "Retrofit Chiller",
						budget: 500_000_000,
						funded: 250_000_000,
						progress: 0.5,
					},
					{
						id: 2,
						title: "Rooftop Solar Panels",
						budget: 800_000_000,
						funded: 560_000_000,
						progress: 0.7,
					},
				];

	const topProjects: AdminProject[] =
		projects.length > 0
			? projects.slice(0, 6)
			: [
					{
						id: 1,
						title: "Retrofit Chiller",
						status: "funding",
						companyName: "PT Green Nusantara",
						industrySector: "Manufacturing",
						budget: 500_000_000,
						riskScore: 72,
						blueprintStatus: "published",
					},
					{
						id: 2,
						title: "Rooftop Solar Panels",
						status: "monitoring",
						companyName: "PT Clean Carbon",
						industrySector: "Logistics",
						budget: 800_000_000,
						riskScore: 55,
						blueprintStatus: "published",
					},
				];

	const topBondsSections: ExportSection[] = [
		{
			title: "Bond Funding Status",
			headers: ["Bond", "Budget", "Raised", "Progress"],
			rows: topBonds.map((row) => [
				row.title,
				row.budget ? idr.format(row.budget) : "-",
				idr.format(row.funded ?? 0),
				`${Math.round((row.progress ?? (row.budget ? (row.funded ?? 0) / row.budget : 0)) * 100)}%`,
			]),
		},
	];

	const topProjectsSections: ExportSection[] = [
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
			rows: topProjects.map((row) => [
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
			value: idr.format(stats.investments.sum),
			icon: faCoins,
			sub: `${stats.investments.total} bonds`,
		},
		{
			label: "ROI Paid",
			value: idr.format(stats.investments.roiPaid),
			icon: faChartLine,
			sub: "return distribution",
		},
		{
			label: "Active Projects",
			value: String(activeProjects),
			icon: faArrowTrendUp,
			sub: `${Object.values(stats.projects).reduce((a, b) => a + b, 0)} total projects`,
		},
		{
			label: "Users",
			value: String(totalUsers),
			icon: faLeaf,
			sub: `${stats.companies} organizations`,
		},
	];
	const latestGrowth = GROWTH_DATA[GROWTH_DATA.length - 1];
	const latestCarbon = CARBON_TREND[CARBON_TREND.length - 1];
	const latestInvestment = INVESTMENT_TREND[INVESTMENT_TREND.length - 1];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Analytics</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Platform performance and trends.
					</p>
				</div>
				<ExportMenu
					filename="analytics"
					title="Analytics"
					sections={[...topBondsSections, ...topProjectsSections]}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{metricCards.map((card) => (
					<MetricCard key={card.label} {...card} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Platform Growth</CardTitle>
						<p className="text-lg font-semibold leading-none tabular-nums">
							{latestGrowth.users + latestGrowth.organizations}
						</p>
					</CardHeader>
					<CardContent className="pt-4">
						<BarChart data={GROWTH_DATA} xDataKey="label" aspectRatio="21 / 9">
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Carbon Impact</CardTitle>
						<p className="text-lg font-semibold leading-none tabular-nums">
							{latestCarbon.value.toFixed(2)}{" "}
							<span className="text-base font-normal text-muted-foreground">
								tCO₂e
							</span>
						</p>
					</CardHeader>
					<CardContent className="pt-4">
						<BarChart data={CARBON_TREND} xDataKey="label" aspectRatio="21 / 9">
							<Grid horizontal />
							<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0 px-6 pb-0 pt-4">
						<CardTitle className="text-lg">Investment Trends</CardTitle>
						<p className="text-lg font-semibold leading-none tabular-nums">
							{idr.format(latestInvestment.value)}
						</p>
					</CardHeader>
					<CardContent className="pt-4">
						<BarChart
							data={INVESTMENT_TREND}
							xDataKey="label"
							aspectRatio="21 / 9"
						>
							<Grid horizontal />
							<Bar dataKey="value" fill="var(--chart-3)" lineCap="round" />
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Bond Funding Status</CardTitle>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={fundingColumns}
							data={topBonds}
							getRowId={(row) => String(row.id)}
							ariaLabel="Bond funding status"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Project Intelligence</CardTitle>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={projectColumns}
							data={topProjects}
							getRowId={(row) => String(row.id)}
							ariaLabel="Project intelligence"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
