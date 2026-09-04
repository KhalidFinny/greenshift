import {
	Bar,
	BarChart,
	BarXAxis,
	Card,
	CardContent,
	CardHeader,
	ChartTooltip,
	Grid,
} from "@greenshift/ui";
import { formatIdr } from "../lib/format";
import type { MonthBucket } from "../lib/portfolio-metrics";

interface MonthlyInvestmentCardProps {
	months: MonthBucket[];
	total: number;
}

export function MonthlyInvestmentCard({
	months,
	total,
}: MonthlyInvestmentCardProps) {
	return (
		<Card className="xl:col-span-2">
			<CardHeader className="px-6 pb-0 pt-6">
				<p className="text-base font-medium text-muted-foreground">
					Nilai Portofolio
				</p>
				<p className="mt-1 text-4xl font-semibold leading-none tracking-tight tabular-nums">
					{formatIdr(total)}
				</p>
				<p className="mt-3 text-base text-muted-foreground">
					Investasi per bulan — penempatan dana obligasi hijau
				</p>
			</CardHeader>
			<CardContent className="pt-4">
				{months.length === 0 ? (
					<p className="text-base text-muted-foreground">
						Belum ada data penempatan dana.
					</p>
				) : (
					<BarChart
						data={months}
						xDataKey="label"
						className="aspect-[7/2]! xl:aspect-[3/1]!"
					>
						<Grid horizontal />
						<Bar dataKey="value" fill="var(--chart-2)" lineCap="round" />
						<BarXAxis />
						<ChartTooltip />
					</BarChart>
				)}
			</CardContent>
		</Card>
	);
}
