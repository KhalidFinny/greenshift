import { useVendorData } from "../lib/use-vendor-data";
import { PerformanceHeroCard } from "../organisms/performance-hero-card";
import { PerformanceMetricsGrid } from "../organisms/performance-metrics-grid";
import { PerformanceTrendCard } from "../organisms/performance-trend-card";

export function VendorPerformancePage() {
	const { performanceMetrics } = useVendorData();

	return (
		<div className="space-y-6">
			<PerformanceHeroCard performanceMetrics={performanceMetrics} />
			<PerformanceTrendCard
				historicalTrend={performanceMetrics.historicalTrend}
			/>
			<PerformanceMetricsGrid metrics={performanceMetrics} />
		</div>
	);
}
