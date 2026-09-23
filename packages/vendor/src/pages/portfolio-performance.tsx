import { faAward, faPencil, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	EmptyState,
	PaginationBar,
	usePagedRows,
} from "@greenshift/ui";
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
	const paged = usePagedRows(portfolio);

	return (
		<div className="space-y-6">
			<section className="space-y-6">
				<PerformanceHeroCard performanceMetrics={performanceMetrics} />
				<PerformanceTrendCard
					historicalTrend={performanceMetrics.historicalTrend}
				/>
				<PerformanceMetricsGrid metrics={performanceMetrics} />
			</section>

			<section className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-base font-semibold text-foreground">
							Project Portfolio
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

				{portfolio.length === 0 ? (
					<EmptyState
						icon={<FontAwesomeIcon icon={faAward} />}
						title="No portfolio records yet"
						description="Completed projects and the track records you author appear here as evidence of delivered work. Add a record to show clients what you have built."
					/>
				) : (
					<>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{paged.pageRows.map((item) => (
								<PortfolioItemCard
									key={item.id}
									item={item}
									onDelete={isEditMode ? deletePortfolioItem : undefined}
								/>
							))}
						</div>
						<PaginationBar
							label="Portfolio records"
							pageIndex={paged.pageIndex}
							pageSize={paged.pageSize}
							pageCount={paged.pageCount}
							total={paged.total}
							onPageIndexChange={paged.setPageIndex}
							onPageSizeChange={paged.setPageSize}
						/>
					</>
				)}
			</section>
		</div>
	);
}
