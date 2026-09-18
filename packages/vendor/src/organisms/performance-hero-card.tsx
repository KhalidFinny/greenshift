import { Card, CardContent } from "@greenshift/ui";
import type { VendorPerformanceMetrics } from "../lib/types";

interface PerformanceHeroCardProps {
	performanceMetrics: VendorPerformanceMetrics;
}

export function PerformanceHeroCard({
	performanceMetrics,
}: PerformanceHeroCardProps) {
	return (
		<Card className="overflow-hidden border border-border bg-card">
			<CardContent className="p-6">
				<div className="flex flex-col gap-6">
					{/* Header with Score */}
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-xs md:text-sm font-bold tracking-wider text-muted-foreground uppercase">
								Verified Performance Score
							</h2>
							<p className="text-xs text-muted-foreground">
								{performanceMetrics.totalCompletedProjects} Verified Projects
							</p>
						</div>
						<div className="flex items-baseline gap-1">
							<span className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
								{performanceMetrics.technicalPerformanceScore}
							</span>
							<span className="text-sm font-normal text-muted-foreground">
								/ 100
							</span>
						</div>
					</div>

					{/* Metrics Grid */}
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div className="rounded-lg bg-muted/50 p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Completion
							</p>
							<p className="mt-1 text-xl font-bold text-foreground">
								{performanceMetrics.completionRatePercent}%
							</p>
						</div>
						<div className="rounded-lg bg-muted/50 p-3">
							<p className="text-xs font-medium text-muted-foreground">
								On-Time
							</p>
							<p className="mt-1 text-xl font-bold text-foreground">
								{performanceMetrics.onTimeCompletionPercent}%
							</p>
						</div>
						<div className="rounded-lg bg-muted/50 p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Energy Savings
							</p>
							<p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
								{performanceMetrics.energySavingAchievementPercent}%
							</p>
						</div>
						<div className="rounded-lg bg-muted/50 p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Satisfaction
							</p>
							<p className="mt-1 text-xl font-bold text-foreground">
								{performanceMetrics.clientApprovalRatePercent}%
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
