import { faPencil, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@greenshift/ui";
import { useState } from "react";
import { useVendorData } from "../lib/use-vendor-data";
import { AddPortfolioDialog } from "../organisms/add-portfolio-dialog";
import { PerformanceHeroCard } from "../organisms/performance-hero-card";
import { PerformanceMetricsGrid } from "../organisms/performance-metrics-grid";
import { PerformanceTrendCard } from "../organisms/performance-trend-card";
import { PortfolioItemCard } from "../organisms/portfolio-item-card";

export function VendorPortfolioPerformancePage() {
	const {
		portfolio,
		addPortfolioItem,
		deletePortfolioItem,
		performanceMetrics,
	} = useVendorData();
	const [isEditMode, setIsEditMode] = useState(false);

	return (
		<div className="space-y-6">
			{/* Performance Section */}
			<section className="space-y-6">
				<PerformanceHeroCard performanceMetrics={performanceMetrics} />
				<PerformanceTrendCard
					historicalTrend={performanceMetrics.historicalTrend}
				/>
				<PerformanceMetricsGrid metrics={performanceMetrics} />
			</section>

			{/* Portfolio / Track Record Section */}
			<section className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-base font-semibold text-foreground">
							Verified Project Portfolio
						</h3>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant={isEditMode ? "destructive" : "outline"}
							size="sm"
							className="gap-2"
							onClick={() => setIsEditMode(!isEditMode)}
						>
							<FontAwesomeIcon icon={isEditMode ? faX : faPencil} />
							{isEditMode ? "Cancel" : "Edit"}
						</Button>
						<AddPortfolioDialog onAdd={addPortfolioItem} />
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{portfolio.map((item) => (
						<PortfolioItemCard
							key={item.id}
							item={item}
							onDelete={isEditMode ? deletePortfolioItem : undefined}
						/>
					))}
				</div>
			</section>
		</div>
	);
}
