import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyState } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { PerformanceHeroCard } from "../organisms/performance-hero-card";
import { PerformanceMetricsGrid } from "../organisms/performance-metrics-grid";
import { PerformanceTrendCard } from "../organisms/performance-trend-card";

export function VendorPerformancePage() {
	const { performanceMetrics } = useVendorData();

	// Every score is derived from completed project work, so an account with none has nothing to plot rather than a page of zeroes.
	const hasVerifiedWork =
		performanceMetrics.totalCompletedProjects > 0 ||
		performanceMetrics.historicalTrend.length > 0;

	if (!hasVerifiedWork) {
		return (
			<EmptyState
				icon={<FontAwesomeIcon icon={faChartLine} />}
				title="No verified performance data yet"
				description="Completion, on-time, and energy performance scores are computed from projects the client has signed off. They appear here after your first handover."
			/>
		);
	}

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
