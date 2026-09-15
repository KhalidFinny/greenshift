import {
	faArrowTrendUp,
	faBug,
	faGaugeHigh,
	faServer,
} from "@fortawesome/free-solid-svg-icons";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import type { ExportSection } from "../lib/export";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";

const KPI = [
	{ label: "Uptime", value: "99.9%", icon: faServer, sub: "24 jam terakhir" },
	{
		label: "API Response",
		value: "142ms",
		icon: faGaugeHigh,
		sub: "rata-rata",
	},
	{
		label: "Error Rate",
		value: "0.3%",
		icon: faBug,
		sub: "dari seluruh request",
	},
	{
		label: "Request Volume",
		value: "48.2k",
		icon: faArrowTrendUp,
		sub: "per hari",
	},
];

const UPTIME_POINTS = [
	{ hour: "00", value: 100 },
	{ hour: "04", value: 100 },
	{ hour: "08", value: 99 },
	{ hour: "12", value: 98 },
	{ hour: "16", value: 99 },
	{ hour: "20", value: 100 },
];

const COMPONENTS = [
	{ name: "API", status: "operational" as const },
	{ name: "Database", status: "operational" as const },
	{ name: "Payment Gateway", status: "operational" as const },
	{ name: "Notification Service", status: "degraded" as const },
	{ name: "Matchmaking Engine", status: "operational" as const },
	{ name: "Storage", status: "operational" as const },
];

const FAILED_JOBS = [
	{
		id: 1,
		name: "roi.sync.job",
		system: "Payment Gateway",
		time: "2026-08-27 10:24",
		status: "retrying",
	},
	{
		id: 2,
		name: "vendor.match.job",
		system: "Matchmaking Engine",
		time: "2026-08-27 09:58",
		status: "failed",
	},
	{
		id: 3,
		name: "notif.digest.job",
		system: "Notification Service",
		time: "2026-08-27 08:10",
		status: "retrying",
	},
];

const SYSTEM_EVENTS = [
	{
		time: "10:24",
		event: "Payment Gateway timeout spike resolved",
		status: "ok" as const,
	},
	{
		time: "09:58",
		event: "Matchmaking queue backlog detected",
		status: "warn" as const,
	},
	{
		time: "08:42",
		event: "Database read replica resynced",
		status: "ok" as const,
	},
	{
		time: "08:10",
		event: "Notification digest retry triggered",
		status: "warn" as const,
	},
];

const STATUS_STYLE = {
	operational: "text-primary",
	degraded: "text-muted-foreground",
	outage: "text-destructive",
} as const;

const STATUS_DOT = {
	operational: "bg-primary",
	degraded: "bg-muted-foreground",
	outage: "bg-destructive",
} as const;

function UptimeSparkline() {
	const width = 320;
	const height = 68;
	const padding = 6;
	const min = 94;
	const max = 100;
	const points = UPTIME_POINTS.map((d, i) => {
		const x =
			padding + (i * (width - padding * 2)) / (UPTIME_POINTS.length - 1);
		const y =
			padding + ((max - d.value) / (max - min)) * (height - padding * 2);
		return `${x},${y}`;
	}).join(" ");

	return (
		<div>
			<svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
				<title>System Health · Last 24 Hours</title>
				<polyline
					points={points}
					fill="none"
					stroke="var(--chart-1)"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<div className="flex justify-between text-base text-muted-foreground">
				{UPTIME_POINTS.map((p) => (
					<span key={p.hour}>{p.hour}</span>
				))}
			</div>
		</div>
	);
}

export function AdminSystem() {
	const operationalComponents = COMPONENTS.filter(
		(component) => component.status === "operational",
	).length;
	const degradedComponents = COMPONENTS.filter(
		(component) => component.status !== "operational",
	).length;
	const retryingJobs = FAILED_JOBS.filter(
		(job) => job.status === "retrying",
	).length;

	const failedJobsSections: ExportSection[] = [
		{
			title: "Failed Jobs",
			headers: ["Job", "System", "Waktu", "Status"],
			rows: FAILED_JOBS.map((job) => [
				job.name,
				job.system,
				job.time,
				job.status,
			]),
		},
	];

	const systemEventsSections: ExportSection[] = [
		{
			title: "System Events",
			headers: ["Waktu", "Peristiwa", "Status"],
			rows: SYSTEM_EVENTS.map((event) => [
				event.time,
				event.event,
				event.status,
			]),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">System</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Kesehatan infrastruktur dan operasional.
					</p>
				</div>
				<ExportMenu
					filename="system"
					title="System"
					sections={[...failedJobsSections, ...systemEventsSections]}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{KPI.map((card) => (
					<MetricCard key={card.label} {...card} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader className="space-y-4">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="space-y-2">
								<p className="text-base text-muted-foreground">
									Reliability snapshot
								</p>
								<CardTitle className="text-xl">System Operations</CardTitle>
							</div>
							<div className="space-y-2 text-left lg:text-right">
								<p className="text-4xl font-semibold leading-none tracking-tight tabular-nums text-primary">
									99.8%
								</p>
								<p className="text-base text-muted-foreground">Success Rate</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-5">
						<div>
							<p className="mb-3 text-base text-muted-foreground">
								System Health · Last 24 Hours
							</p>
							<UptimeSparkline />
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-lg border p-4">
								<p className="text-base text-muted-foreground">Operational</p>
								<p className="mt-3 text-xl font-semibold tabular-nums">
									{operationalComponents}/{COMPONENTS.length}
								</p>
							</div>
							<div className="rounded-lg border p-4">
								<p className="text-base text-muted-foreground">Degraded</p>
								<p className="mt-3 text-xl font-semibold tabular-nums">
									{degradedComponents}
								</p>
							</div>
							<div className="rounded-lg border p-4">
								<p className="text-base text-muted-foreground">Retrying Jobs</p>
								<p className="mt-3 text-xl font-semibold tabular-nums">
									{retryingJobs}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Kesehatan Sistem</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2.5">
							{COMPONENTS.map((component) => (
								<li
									key={component.name}
									className="flex items-center justify-between text-base"
								>
									<span>{component.name}</span>
									<span
										className={`flex items-center gap-2 ${STATUS_STYLE[component.status]}`}
									>
										<span
											className={`size-2 rounded-full ${STATUS_DOT[component.status]}`}
											aria-hidden="true"
										/>
										{component.status === "operational"
											? "Operational"
											: component.status === "degraded"
												? "Degraded"
												: "Outage"}
									</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Failed Jobs</CardTitle>
					</CardHeader>
					<CardContent>
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead>Job</TableHead>
									<TableHead>System</TableHead>
									<TableHead>Waktu</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{FAILED_JOBS.map((job) => (
									<TableRow key={job.id}>
										<TableCell className="font-medium">{job.name}</TableCell>
										<TableCell>{job.system}</TableCell>
										<TableCell>{job.time}</TableCell>
										<TableCell>
											<Badge
												variant={
													job.status === "failed" ? "destructive" : "secondary"
												}
												className="text-base px-3 !h-8 rounded-md"
											>
												{job.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">System Events</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-3">
							{SYSTEM_EVENTS.map((event) => (
								<li
									key={`${event.time}-${event.event}`}
									className="flex items-start gap-3 rounded-md border p-3 text-base"
								>
									<span
										className={`mt-1 size-2 rounded-full ${event.status === "ok" ? "bg-primary" : "bg-muted-foreground"}`}
										aria-hidden="true"
									/>
									<div>
										<p className="font-medium">{event.event}</p>
										<p className="text-muted-foreground">{event.time}</p>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
