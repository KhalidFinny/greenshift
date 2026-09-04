import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	PieChart,
	PieSlice,
} from "@greenshift/ui";

export interface PortfolioDonutSlice {
	label: string;
	value: number;
	display: string;
	color?: string;
}

interface PortfolioDonutCardProps {
	title: string;
	centerValue: string;
	centerLabel: string;
	slices: PortfolioDonutSlice[];
}

/** Compact investing-style donut + legend so the table still fits below it. */
export function PortfolioDonutCard({
	title,
	centerValue,
	centerLabel,
	slices,
}: PortfolioDonutCardProps) {
	const data = slices.filter((slice) => slice.value > 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="grid items-center gap-4 pt-0 md:grid-cols-[220px_minmax(0,1fr)]">
				<div className="relative mx-auto h-[220px] w-[220px]">
					<PieChart
						data={data}
						size={220}
						innerRadius={74}
						padAngle={0.03}
						cornerRadius={4}
					>
						{data.map((slice, index) => (
							<PieSlice key={slice.label} index={index} />
						))}
					</PieChart>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
						<p className="text-3xl font-semibold leading-none tabular-nums">
							{centerValue}
						</p>
						<p className="mt-2 text-base text-muted-foreground">{centerLabel}</p>
					</div>
				</div>

				<div className="space-y-3">
					{data.map((slice) => (
						<div key={slice.label} className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<span
									className="size-3 shrink-0 rounded-full"
									style={{ background: slice.color ?? "var(--chart-1)" }}
								/>
								<p className="text-base text-muted-foreground">{slice.label}</p>
							</div>
							<p className="text-base font-semibold tabular-nums">{slice.display}</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
