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
} from "@greenshift/ui";
import type { SectorSlice } from "../lib/portfolio-metrics";

// Type alias so the objects carry the implicit index signature BarChart wants.
export type SectorBar = {
	label: string;
	value: number;
};

export function SectorAllocationCard({ sectors }: { sectors: SectorSlice[] }) {
	const data: SectorBar[] = sectors.map((slice) => ({
		label: slice.sector,
		value: slice.amount,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Alokasi per Sektor</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<BarChart data={data} xDataKey="label" aspectRatio="16 / 10">
					<Grid horizontal />
					<Bar dataKey="value" fill="var(--chart-4)" lineCap="round" />
					<BarXAxis />
					<ChartTooltip />
				</BarChart>
				<div className="mt-4 space-y-2">
					{sectors.map((slice) => (
						<div
							key={slice.sector}
							className="flex items-center justify-between gap-4"
						>
							<p className="text-base text-muted-foreground">
								{slice.sector}
							</p>
							<p className="text-base font-medium tabular-nums">
								{Math.round(slice.share * 100)}%
							</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
