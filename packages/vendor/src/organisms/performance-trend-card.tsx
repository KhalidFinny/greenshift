import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
} from "@greenshift/ui";

interface PerformanceTrendCardProps {
	historicalTrend?: { period: string; score: number }[];
}

function TrendLineChart({
	data,
}: {
	data: { period: string; score: number }[];
}) {
	const width = 640;
	const height = 220;
	const padding = { top: 30, right: 35, bottom: 40, left: 55 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;

	const minScore = 85;
	const maxScore = 100;
	const ticks = [100, 95, 90, 85];

	const getX = (index: number) =>
		padding.left + (index / (data.length - 1)) * chartWidth;
	const getY = (score: number) =>
		padding.top +
		chartHeight -
		((score - minScore) / (maxScore - minScore)) * chartHeight;

	const pathD = data
		.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.score)}`)
		.join(" ");

	const areaD = `${pathD} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

	return (
		<div className="w-full overflow-x-auto">
			<svg
				viewBox={`0 0 ${width} ${height}`}
				className="h-auto w-full min-w-[480px] select-none"
				role="img"
				aria-label="Verified Performance Score Trend"
			>
				<title>Verified Performance Score Trend</title>
				<defs>
					<linearGradient
						id="scoreLineGradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="0%"
					>
						<stop offset="0%" stopColor="#10b981" />
						<stop offset="100%" stopColor="#059669" />
					</linearGradient>
					<linearGradient
						id="scoreAreaGradient"
						x1="0%"
						y1="0%"
						x2="0%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
						<stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
					</linearGradient>
				</defs>

				{/* Horizontal Grid lines & Y-axis ticks */}
				{ticks.map((tick) => {
					const y = getY(tick);
					return (
						<g key={tick}>
							{/* Horizontal grid line across */}
							<line
								x1={padding.left}
								y1={y}
								x2={padding.left + chartWidth}
								y2={y}
								stroke="currentColor"
								className="text-border/60"
								strokeDasharray="4 4"
							/>

							{/* Y-axis tick mark ┤ */}
							<line
								x1={padding.left - 5}
								y1={y}
								x2={padding.left}
								y2={y}
								stroke="currentColor"
								className="text-muted-foreground/60"
								strokeWidth="1.5"
							/>

							{/* Y-axis label */}
							<text
								x={padding.left - 10}
								y={y + 4}
								textAnchor="end"
								className="fill-muted-foreground text-sm font-mono font-medium"
							>
								{tick}
							</text>
						</g>
					);
				})}

				{/* Y-axis baseline */}
				<line
					x1={padding.left}
					y1={padding.top}
					x2={padding.left}
					y2={padding.top + chartHeight}
					stroke="currentColor"
					className="text-border"
					strokeWidth="1.5"
				/>

				{/* X-axis baseline └──────────────────────────── */}
				<line
					x1={padding.left}
					y1={padding.top + chartHeight}
					x2={padding.left + chartWidth}
					y2={padding.top + chartHeight}
					stroke="currentColor"
					className="text-border"
					strokeWidth="1.5"
				/>

				{/* Area gradient under line */}
				<path d={areaD} fill="url(#scoreAreaGradient)" />

				{/* Trend line */}
				<path
					d={pathD}
					fill="none"
					stroke="url(#scoreLineGradient)"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{/* Data points & X-axis labels */}
				{data.map((d, i) => {
					const cx = getX(i);
					const cy = getY(d.score);

					return (
						<g key={d.period} className="group/point cursor-pointer">
							{/* Hover vertical guide */}
							<line
								x1={cx}
								y1={padding.top}
								x2={cx}
								y2={padding.top + chartHeight}
								stroke="currentColor"
								className="text-emerald-500/40 opacity-0 transition-opacity group-hover/point:opacity-100"
								strokeDasharray="2 2"
							/>

							{/* X-axis Tick label (e.g. 24Q1, 24Q3, 25Q1, 25Q3, 26Q1) */}
							<text
								x={cx}
								y={padding.top + chartHeight + 22}
								textAnchor="middle"
								className="fill-muted-foreground text-sm font-medium transition-colors group-hover/point:fill-emerald-600 group-hover/point:font-bold"
							>
								{d.period}
							</text>

							{/* Point value label */}
							<text
								x={cx}
								y={cy - 12}
								textAnchor="middle"
								className="fill-foreground text-sm font-bold transition-all group-hover/point:fill-emerald-600"
							>
								{d.score}
							</text>

							{/* Point circle (●) */}
							<circle
								cx={cx}
								cy={cy}
								r="5.5"
								className="fill-emerald-600 stroke-card transition-all group-hover/point:r-[7.5px]"
								strokeWidth="2.5"
							/>
						</g>
					);
				})}
			</svg>
		</div>
	);
}

export function PerformanceTrendCard({
	historicalTrend,
}: PerformanceTrendCardProps) {
	const trendData = historicalTrend ?? [];

	return (
		<Card className="overflow-hidden border border-border bg-card">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm md:text-base font-semibold text-foreground">
					Verified Performance Score
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-2 pb-6 px-6">
				{trendData.length > 1 ? (
					<TrendLineChart data={trendData} />
				) : (
					<EmptyState
						icon={<FontAwesomeIcon icon={faChartLine} />}
						title="No verified performance history yet"
						description="A score is recorded each period after a client signs off a milestone, so the trend starts building once your first project is under execution."
					/>
				)}
			</CardContent>
		</Card>
	);
}
