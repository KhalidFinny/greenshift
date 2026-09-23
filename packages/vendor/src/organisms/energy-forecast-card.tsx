import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	PaginationBar,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import type { EnergyForecast } from "../lib/types";

interface EnergyForecastCardProps {
	forecasts: EnergyForecast[];
	/** Forecasts still in flight: same card frame, shimmering rows. */
	loading?: boolean;
}

/** Accuracy metrics are optional, so the line only shows what the model reported. */
function modelAccuracy(forecast: EnergyForecast): string | null {
	const parts: string[] = [];
	if (typeof forecast.metrics?.r2 === "number") {
		parts.push(`R² ${forecast.metrics.r2.toFixed(3)}`);
	}
	if (typeof forecast.metrics?.cvRmse === "number") {
		parts.push(`CV-RMSE ${forecast.metrics.cvRmse.toFixed(2)}%`);
	}
	return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * What the predictive model expects the site to consume and save over the
 * coming periods. Forward looking by nature, so it sits next to the reported
 * actuals rather than replacing them.
 */
export function EnergyForecastCard({
	forecasts,
	loading = false,
}: EnergyForecastCardProps) {
	const accuracy = forecasts[0] ? modelAccuracy(forecasts[0]) : null;
	const paged = usePagedRows(forecasts);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faChartLine} className="text-emerald-700" />
					Energy Forecast
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p className="text-muted-foreground">
					Modelled consumption and expected savings for the periods ahead,
					projected from the metered baseline and the operating data of this
					project.
				</p>

				{loading ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<ShimmerBlock key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				) : forecasts.length === 0 ? (
					<EmptyState
						icon={<FontAwesomeIcon icon={faChartLine} />}
						title="No forecast available"
						description="A forecast appears here once the model has enough metered history for this project."
					/>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Model: {forecasts[0].modelName}</Badge>
							{accuracy ? <Badge variant="outline">{accuracy}</Badge> : null}
						</div>
						<div className="overflow-hidden rounded-xl border border-border">
							<div className="flex justify-between bg-muted px-4 py-3 font-semibold">
								<span>Forecast Period</span>
								<span>Consumption (kWh)</span>
								<span>Expected Saving (kWh)</span>
							</div>
							<div className="divide-y divide-border">
								{paged.pageRows.map((forecast) => (
									<div
										key={forecast.id}
										className="flex items-center justify-between p-4"
									>
										<span className="font-semibold">{forecast.period}</span>
										<span>
											{forecast.forecastedConsumptionKwh.toLocaleString(
												"en-US",
											)}{" "}
											kWh
										</span>
										<span className="font-semibold text-emerald-700">
											{forecast.forecastedSavingsKwh.toLocaleString("en-US")}{" "}
											kWh
										</span>
									</div>
								))}
							</div>
						</div>
					</>
				)}

				<PaginationBar
					label="Forecast periods"
					pageIndex={paged.pageIndex}
					pageSize={paged.pageSize}
					pageCount={paged.pageCount}
					total={paged.total}
					onPageIndexChange={paged.setPageIndex}
					onPageSizeChange={paged.setPageSize}
				/>
			</CardContent>
		</Card>
	);
}
