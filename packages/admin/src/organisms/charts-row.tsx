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
} from "@greenshift/ui";

interface ChartsRowProps {
	activityData: Array<{ label: string; value: number }>;
	carbonReduction: number;
}

export function ChartsRow({ activityData, carbonReduction }: ChartsRowProps) {
	const carbonData = [
		{
			label: "Achieved",
			value: carbonReduction,
			maxValue: 100,
			color: "var(--chart-1)",
		},
		{
			label: "Target",
			value: 100 - carbonReduction,
			maxValue: 100,
			color: "var(--chart-5)",
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-xl">Platform Activity</CardTitle>
					<p className="text-base text-muted-foreground">
						Project submissions per month (2026)
					</p>
				</CardHeader>
				<CardContent className="pt-0">
					<BarChart data={activityData} xDataKey="label" aspectRatio="16 / 9">
						<Grid horizontal />
						<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
						<BarXAxis />
						<ChartTooltip />
					</BarChart>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-xl">Carbon Reduction</CardTitle>
					<p className="text-base text-muted-foreground">
						Progress toward the annual target
					</p>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="relative mx-auto w-fit">
						<RingChart data={carbonData} size={220} strokeWidth={20}>
							<Ring index={0} />
							<Ring index={1} />
						</RingChart>
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
							<p className="text-4xl font-semibold leading-none tabular-nums text-primary">
								{carbonReduction}
							</p>
							<p className="mt-2 text-base text-muted-foreground">ton CO₂e</p>
						</div>
					</div>

					<div className="mt-6 overflow-hidden rounded-xl border border-border/70">
						{[
							{
								label: "CO₂e reduced",
								value: `${carbonReduction} tons`,
							},
							{
								label: "Target progress",
								value: `${carbonReduction}%`,
							},
							{
								label: "Energy saved",
								value: "63.000 kWh",
							},
						].map((stat, index) => (
							<div
								key={stat.label}
								className={`flex items-center justify-between gap-4 px-4 py-4 ${
									index < 2 ? "border-b border-border/70" : ""
								}`}
							>
								<p className="text-base text-muted-foreground">{stat.label}</p>
								<p className="text-xl font-semibold leading-none tabular-nums text-primary">
									{stat.value}
								</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
