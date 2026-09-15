import {
	faArrowTrendUp,
	faChartLine,
	faCoins,
	faLeaf,
} from "@fortawesome/free-solid-svg-icons";
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
	EmptyState,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ExportSection } from "../lib/export";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";

const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const GROWTH_DATA = [
	{ label: "Jan", users: 4, organizations: 2 },
	{ label: "Feb", users: 6, organizations: 3 },
	{ label: "Mar", users: 7, organizations: 4 },
	{ label: "Apr", users: 9, organizations: 5 },
	{ label: "Mei", users: 12, organizations: 6 },
	{ label: "Jun", users: 14, organizations: 7 },
	{ label: "Jul", users: 18, organizations: 9 },
	{ label: "Agu", users: 21, organizations: 11 },
];

const CARBON_TREND = [
	{ label: "Jan", value: 8 },
	{ label: "Feb", value: 12 },
	{ label: "Mar", value: 16 },
	{ label: "Apr", value: 21 },
	{ label: "Mei", value: 28 },
	{ label: "Jun", value: 34 },
	{ label: "Jul", value: 41 },
	{ label: "Agu", value: 49.77 },
];

const INVESTMENT_TREND = [
	{ label: "Jan", value: 120_000_000 },
	{ label: "Feb", value: 180_000_000 },
	{ label: "Mar", value: 260_000_000 },
	{ label: "Apr", value: 390_000_000 },
	{ label: "Mei", value: 560_000_000 },
	{ label: "Jun", value: 920_000_000 },
	{ label: "Jul", value: 1_600_000_000 },
	{ label: "Agu", value: 2_500_000_000 },
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
					title="Gagal memuat analytics"
					description="Tidak dapat mengambil data performa platform."
				/>
			</div>
		);
	}

	const stats = statsQuery.data;
	const projects = projectsQuery.data.projects;

	const totalUsers = Object.values(stats.users).reduce((a, b) => a + b, 0);
	const activeProjects =
		(stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0);
	// Obligasi funding status: the same public obligasi data surfaced on the
	// public dashboard, aggregated here for admin without any per-investor rows.
	const topObligasi =
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
						title: "Panel Surya Atap",
						budget: 800_000_000,
						funded: 560_000_000,
						progress: 0.7,
					},
				];

	const topProjects =
		projects.length > 0
			? projects.slice(0, 6)
			: [
					{
						id: 1,
						title: "Retrofit Chiller",
						status: "funding",
						companyName: "PT Hijau Nusantara",
						industrySector: "Manufaktur",
						budget: 500_000_000,
						riskScore: 72,
						blueprintStatus: "published",
					},
					{
						id: 2,
						title: "Panel Surya Atap",
						status: "monitoring",
						companyName: "PT Karbon Bersih",
						industrySector: "Logistik",
						budget: 800_000_000,
						riskScore: 55,
						blueprintStatus: "published",
					},
				];

	const topObligasiSections: ExportSection[] = [
		{
			title: "Status Pendanaan Obligasi",
			headers: ["Obligasi", "Anggaran", "Terkumpul", "Progres"],
			rows: topObligasi.map((row) => [
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
				"Proyek",
				"Perusahaan",
				"Sektor",
				"Status",
				"Anggaran",
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
			label: "Total Investasi",
			value: idr.format(stats.investments.sum),
			icon: faCoins,
			sub: `${stats.investments.total} obligasi`,
		},
		{
			label: "ROI Dibayar",
			value: idr.format(stats.investments.roiPaid),
			icon: faChartLine,
			sub: "distribusi imbal hasil",
		},
		{
			label: "Proyek Aktif",
			value: String(activeProjects),
			icon: faArrowTrendUp,
			sub: `${Object.values(stats.projects).reduce((a, b) => a + b, 0)} total proyek`,
		},
		{
			label: "Pengguna",
			value: String(totalUsers),
			icon: faLeaf,
			sub: `${stats.companies} organisasi`,
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
						Performa dan tren platform.
					</p>
				</div>
				<ExportMenu
					filename="analytics"
					title="Analytics"
					sections={[...topObligasiSections, ...topProjectsSections]}
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
						<CardTitle className="text-xl">Status Pendanaan Obligasi</CardTitle>
					</CardHeader>
					<CardContent>
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead>Obligasi</TableHead>
									<TableHead>Anggaran</TableHead>
									<TableHead>Terkumpul</TableHead>
									<TableHead>Progres</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topObligasi.map((row) => {
									const progress =
										row.progress ??
										(row.budget ? (row.funded ?? 0) / row.budget : 0);
									return (
										<TableRow key={row.id}>
											<TableCell className="font-medium">{row.title}</TableCell>
											<TableCell className="tabular-nums">
												{row.budget ? idr.format(row.budget) : "-"}
											</TableCell>
											<TableCell className="tabular-nums">
												{idr.format(row.funded ?? 0)}
											</TableCell>
											<TableCell className="tabular-nums">
												<div className="flex items-center gap-3">
													<div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
														<div
															className="h-full rounded-full bg-primary"
															style={{
																width: `${Math.round(progress * 100)}%`,
															}}
														/>
													</div>
													{Math.round(progress * 100)}%
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Project Intelligence</CardTitle>
					</CardHeader>
					<CardContent>
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead>Proyek</TableHead>
									<TableHead>Sektor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Anggaran</TableHead>
									<TableHead>Risk</TableHead>
									<TableHead>Blueprint</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topProjects.map((row) => (
									<TableRow key={row.id}>
										<TableCell>
											<p className="font-medium">{row.title}</p>
											<p className="text-muted-foreground">{row.companyName}</p>
										</TableCell>
										<TableCell>{row.industrySector ?? "-"}</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												className="text-base px-3 !h-8 rounded-md"
											>
												{row.status}
											</Badge>
										</TableCell>
										<TableCell className="tabular-nums">
											{row.budget ? idr.format(row.budget) : "-"}
										</TableCell>
										<TableCell className="tabular-nums">
											{row.riskScore ?? "-"}
										</TableCell>
										<TableCell>
											{row.blueprintStatus ? (
												<Badge
													variant="outline"
													className="text-base px-3 !h-8 rounded-md"
												>
													{row.blueprintStatus}
												</Badge>
											) : (
												"-"
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
