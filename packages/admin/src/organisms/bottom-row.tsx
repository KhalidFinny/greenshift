import {
	faCircleCheck,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

interface PendingAction {
	id: number;
	title: string;
	type: string;
	severity: "medium" | "low";
}

interface SystemComponent {
	name: string;
	status: "operational" | "degraded" | "outage";
}

interface UptimePoint {
	hour: string;
	value: number;
}

interface BottomRowProps {
	pendingActions: PendingAction[];
	successRate: number;
	uptime: UptimePoint[];
	components: SystemComponent[];
}

const STATUS_STYLE: Record<SystemComponent["status"], string> = {
	operational: "text-primary",
	degraded: "text-muted-foreground",
	outage: "text-destructive",
};

const STATUS_DOT: Record<SystemComponent["status"], string> = {
	operational: "bg-primary",
	degraded: "bg-muted-foreground",
	outage: "bg-destructive",
};

const STATUS_LABEL: Record<SystemComponent["status"], string> = {
	operational: "Operational",
	degraded: "Degraded",
	outage: "Outage",
};

function UptimeSparkline({ data }: { data: UptimePoint[] }) {
	const width = 220;
	const height = 48;
	const padding = 4;
	const min = 94;
	const max = 100;

	const points = data
		.map((d, i) => {
			const x = padding + (i * (width - padding * 2)) / (data.length - 1);
			const y =
				padding + ((max - d.value) / (max - min)) * (height - padding * 2);
			return `${x},${y}`;
		})
		.join(" ");

	return (
		<div>
			<svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full">
				<title>Uptime over the last 24 hours</title>
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
				{data.map((d) => (
					<span key={d.hour}>{d.hour}</span>
				))}
			</div>
		</div>
	);
}

export function BottomRow({
	pendingActions,
	successRate,
	uptime,
	components,
}: BottomRowProps) {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="text-xl">Pending Actions</CardTitle>
						<Button asChild variant="outline" className="!h-9 px-4 text-base">
							<Link to="/admin/audit-logs">View more</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<ul className="space-y-3">
						{pendingActions.map((action) => (
							<li
								key={action.id}
								className="flex items-start gap-4 rounded-xl border border-border/70 bg-muted/10 p-4"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
									<FontAwesomeIcon
										icon={
											action.severity === "medium"
												? faTriangleExclamation
												: faCircleCheck
										}
										className={
											action.severity === "medium"
												? "text-destructive"
												: "text-muted-foreground"
										}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-base font-medium">{action.title}</p>
									<p className="mt-1 text-base text-muted-foreground">
										{action.type}
									</p>
								</div>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-xl">System Health</CardTitle>
					<p className="text-base text-muted-foreground">
						Performance summary of the last 24 hours
					</p>
				</CardHeader>
				<CardContent className="space-y-5 pt-0">
					<div>
						<p className="text-4xl font-semibold tabular-nums text-primary">
							{successRate}%
						</p>
						<p className="mt-2 text-base text-muted-foreground">Success Rate</p>
					</div>

					<div className="rounded-xl border border-border/70 bg-muted/10 p-4">
						<p className="mb-3 text-base text-muted-foreground">
							System Health · Last 24 Hours
						</p>
						<UptimeSparkline data={uptime} />
					</div>

					<ul className="space-y-3">
						{components.map((component) => (
							<li
								key={component.name}
								className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 text-base last:border-b-0 last:pb-0"
							>
								<span>{component.name}</span>
								<span
									className={`flex items-center gap-2 ${STATUS_STYLE[component.status]}`}
								>
									<span
										className={`size-2 rounded-full ${STATUS_DOT[component.status]}`}
										aria-hidden="true"
									/>
									{STATUS_LABEL[component.status]}
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
