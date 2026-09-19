import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import { formatCompactRupiah } from "../lib/format";
import type { VendorPerformanceMetrics } from "../lib/types";

interface PerformanceMetricsGridProps {
	metrics: VendorPerformanceMetrics;
}

export function ExecutionDeliveryCard({
	metrics,
}: {
	metrics: VendorPerformanceMetrics;
}) {
	return (
		<Card className="overflow-hidden border border-border bg-card">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm md:text-sm font-semibold text-muted-foreground">
					EXECUTION & DELIVERY
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5 pt-2 pb-6 px-6">
				{/* Success Rate */}
				<div className="space-y-1.5">
					<p className="text-sm font-medium text-muted-foreground">
						Success Rate
					</p>
					<div className="flex items-center gap-3">
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-700 transition-all duration-500"
								style={{
									width: `${Math.min(metrics.completionRatePercent, 100)}%`,
								}}
							/>
						</div>
						<span className="w-12 text-right text-sm font-bold text-foreground shrink-0">
							{metrics.completionRatePercent}%
						</span>
					</div>
				</div>

				{/* On-Time */}
				<div className="space-y-1.5">
					<p className="text-sm font-medium text-muted-foreground">On-Time</p>
					<div className="flex items-center gap-3">
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-700 transition-all duration-500"
								style={{
									width: `${Math.min(metrics.onTimeCompletionPercent, 100)}%`,
								}}
							/>
						</div>
						<span className="w-12 text-right text-sm font-bold text-foreground shrink-0">
							{metrics.onTimeCompletionPercent}%
						</span>
					</div>
				</div>

				{/* Avg Project Value */}
				<div className="space-y-1 pt-1">
					<p className="text-sm font-medium text-muted-foreground">
						Avg Project Value
					</p>
					<p className="text-xl md:text-2xl font-bold text-foreground">
						{formatCompactRupiah(metrics.averageProjectValue)}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function GreenImpactCard({
	metrics,
}: {
	metrics: VendorPerformanceMetrics;
}) {
	const maxScale = 120;

	return (
		<Card className="overflow-hidden border border-border bg-card">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm md:text-sm font-semibold text-muted-foreground">
					GREEN IMPACT
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5 pt-2 pb-6 px-6">
				{/* Energy Savings */}
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">
						Energy Savings
					</p>

					{/* Target */}
					<div className="flex items-center gap-3">
						<span className="w-12 text-sm text-muted-foreground font-medium shrink-0">
							Target
						</span>
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-muted-foreground/35 transition-all duration-500"
								style={{ width: `${(100 / maxScale) * 100}%` }}
							/>
						</div>
						<span className="w-14 text-right text-sm font-medium text-muted-foreground shrink-0">
							100%
						</span>
					</div>

					{/* Actual */}
					<div className="flex items-center gap-3">
						<span className="w-12 text-sm font-semibold text-foreground shrink-0">
							Actual
						</span>
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-700 transition-all duration-500"
								style={{
									width: `${Math.min((metrics.energySavingAchievementPercent / maxScale) * 100, 100)}%`,
								}}
							/>
						</div>
						<span className="w-14 text-right text-sm font-bold text-emerald-700 shrink-0">
							{metrics.energySavingAchievementPercent}%
						</span>
					</div>
				</div>

				{/* Carbon Reduction */}
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">
						Carbon Reduction
					</p>

					{/* Target */}
					<div className="flex items-center gap-3">
						<span className="w-12 text-sm text-muted-foreground font-medium shrink-0">
							Target
						</span>
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-muted-foreground/35 transition-all duration-500"
								style={{ width: `${(100 / maxScale) * 100}%` }}
							/>
						</div>
						<span className="w-14 text-right text-sm font-medium text-muted-foreground shrink-0">
							100%
						</span>
					</div>

					{/* Actual */}
					<div className="flex items-center gap-3">
						<span className="w-12 text-sm font-semibold text-foreground shrink-0">
							Actual
						</span>
						<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-700 transition-all duration-500"
								style={{
									width: `${Math.min((metrics.carbonReductionAchievementPercent / maxScale) * 100, 100)}%`,
								}}
							/>
						</div>
						<span className="w-14 text-right text-sm font-bold text-emerald-700 shrink-0">
							{metrics.carbonReductionAchievementPercent}%
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function PerformanceMetricsGrid({
	metrics,
}: PerformanceMetricsGridProps) {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			<ExecutionDeliveryCard metrics={metrics} />
			<GreenImpactCard metrics={metrics} />
		</div>
	);
}
