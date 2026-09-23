import {
	Bar,
	BarChart,
	BarXAxis,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	Grid,
	Ring,
	RingChart,
	ShimmerBlock,
} from "@greenshift/ui";

interface ChartsRowProps {
	activityData: Array<{ label: string; value: number }>;
	carbonReduction: number;
	carbonTarget: number;
	loading?: boolean;
}

export function ChartsRow({
	activityData,
	carbonReduction,
	carbonTarget,
	loading = false,
}: ChartsRowProps) {
	const achieved = Math.min(carbonReduction, carbonTarget);
	const carbonData = [
		{
			label: "Achieved",
			value: achieved,
			maxValue: carbonTarget || 1,
			color: "var(--chart-1)",
		},
		{
			label: "Target",
			value: Math.max(carbonTarget - achieved, 0),
			maxValue: carbonTarget || 1,
			color: "var(--chart-5)",
		},
	];
	const share =
		carbonTarget > 0 ? Math.round((carbonReduction / carbonTarget) * 100) : 0;
	const carbonStats = [
		{
			label: "CO₂e reduced",
			value: `${carbonReduction.toLocaleString("en-US")} tons`,
		},
		{
			label: "Project target",
			value: `${carbonTarget.toLocaleString("en-US")} tons`,
		},
		{
			label: "Target progress",
			value: `${share}%`,
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-xl">Platform Activity</CardTitle>
					<p className="text-base text-muted-foreground">
						Projects submitted per month
					</p>
				</CardHeader>
				<CardContent className="pt-0">
					{loading ? (
						<ShimmerBlock className="aspect-[16/9] w-full" />
					) : (
						<BarChart data={activityData} xDataKey="label" aspectRatio="16 / 9">
							<Grid horizontal />
							<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-xl">Carbon Reduction</CardTitle>
					<p className="text-base text-muted-foreground">
						Measured against what the projects target
					</p>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="relative mx-auto w-fit">
						{loading ? (
							<ShimmerBlock className="size-[220px] rounded-full" />
						) : (
							<>
								<RingChart data={carbonData} size={220} strokeWidth={20}>
									<Ring index={0} />
									<Ring index={1} />
								</RingChart>
								<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
									<p className="text-4xl font-semibold leading-none tabular-nums text-primary">
										{carbonReduction.toLocaleString("en-US")}
									</p>
									<p className="mt-2 text-base text-muted-foreground">
										ton CO₂e
									</p>
								</div>
							</>
						)}
					</div>

					<div className="mt-6 overflow-hidden rounded-xl border border-border/70">
						{carbonStats.map((stat, index) => (
							<div
								key={stat.label}
								className={`flex items-center justify-between gap-4 px-4 py-4 ${
									index < 2 ? "border-b border-border/70" : ""
								}`}
							>
								<p className="text-base text-muted-foreground">{stat.label}</p>
								{loading ? (
									<ShimmerBlock className="h-6 w-28" />
								) : (
									<p className="text-xl font-semibold leading-none tabular-nums text-primary">
										{stat.value}
									</p>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
