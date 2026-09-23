import { faChartColumn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Bar,
	BarChart,
	BarXAxis,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	EmptyState,
	Grid,
	ShimmerBlock,
} from "@greenshift/ui";
import {
	formatCount,
	formatDate,
	formatRupiah,
	formatTonnes,
} from "../lib/format";
import { PORTFOLIO_STATUS_LABEL } from "../lib/types";
import { useVendorData } from "../lib/use-vendor-data";
import { DetailHero, DetailShell } from "../molecules/detail-shell";

const NOT_RECORDED = "Not recorded";

/** The chart's series names double as the tooltip labels, so the accessor and the caption cannot drift apart. */
const ENERGY_SERIES = "Energy saved (kWh)";
const CARBON_SERIES = "Carbon abated (tCO₂e)";

interface PortfolioFact {
	label: string;
	value: string;
	/** Set only on the filed document, which the reader opens. */
	documentUrl?: string | null;
}

function dateOrNotRecorded(iso: string | null | undefined): string {
	return iso ? formatDate(iso) : NOT_RECORDED;
}

export function VendorPortfolioItemDetailPage({ itemId }: { itemId?: string }) {
	const { isLoading, portfolio } = useVendorData();

	const item = portfolio.find((i) => i.id === itemId) ?? portfolio[0];

	if (!isLoading && !item) {
		return (
			<DetailShell
				backTo="/vendor/portfolio"
				backLabel="Back to Portfolio"
				hero={null}
			>
				<EmptyState
					title="Record not found"
					description="This portfolio record is no longer on file. It may have been removed."
				/>
			</DetailShell>
		);
	}

	// A record the vendor authored by hand carries no delivery state; an awarded one always does.
	const status = item?.status ?? null;
	const statusLabel = status ? PORTFOLIO_STATUS_LABEL[status] : NOT_RECORDED;
	const documentUrl = item?.documentUrl ?? null;
	const periods = item?.monthlyReports ?? [];

	const facts: PortfolioFact[] = [
		{ label: "Client", value: item?.clientName || NOT_RECORDED },
		{ label: "Location", value: item?.location || NOT_RECORDED },
		{ label: "Sector", value: item?.projectType || NOT_RECORDED },
		{ label: "Status", value: statusLabel },
		{
			label: "Bid submitted",
			value: dateOrNotRecorded(item?.bidSubmittedAt),
		},
		{ label: "Work started", value: dateOrNotRecorded(item?.workStartedAt) },
		{
			label: "Target completion",
			value: dateOrNotRecorded(item?.targetCompletionAt),
		},
		{
			label: "Duration",
			value:
				typeof item?.durationMonths === "number"
					? `${item.durationMonths} month${item.durationMonths === 1 ? "" : "s"}`
					: NOT_RECORDED,
		},
		{
			label: "Milestones",
			value: item?.milestonesTotal
				? `${item.milestonesApproved ?? 0} of ${item.milestonesTotal} approved`
				: NOT_RECORDED,
		},
		{
			label: "MRV periods",
			value: item?.latestReportPeriod
				? `${periods.length} reported · latest ${item.latestReportPeriod}`
				: NOT_RECORDED,
		},
	];

	if (documentUrl) {
		facts.push({
			label: "Document",
			value: item?.documentName || "Document",
			documentUrl,
		});
	}

	const energyData = periods.map((report) => ({
		period: report.period,
		[ENERGY_SERIES]: report.energySavedKwh,
	}));
	const carbonData = periods.map((report) => ({
		period: report.period,
		[CARBON_SERIES]: report.carbonSavedTons,
	}));

	return (
		<DetailShell
			backTo="/vendor/portfolio"
			backLabel="Back to Portfolio"
			hero={
				<DetailHero
					loading={isLoading}
					title={item?.projectName}
					badges={
						item ? (
							<span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
								{status ? statusLabel : "Delivered work"}
							</span>
						) : null
					}
					meta={
						item?.clientName ? (
							<span className="text-base text-emerald-100/80">
								{item.clientName}
							</span>
						) : null
					}
					stats={[
						{
							label: "Project value",
							value: formatRupiah(item?.projectValue),
						},
						{
							label: "Carbon reduction",
							value:
								item?.carbonReductionTons !== null &&
								item?.carbonReductionTons !== undefined
									? `${item.carbonReductionTons} tCO₂e/yr`
									: "Not reported",
							tone: "positive",
						},
						{
							label: "Energy saved",
							value:
								item?.energySavingKwh !== null &&
								item?.energySavingKwh !== undefined
									? `${item.energySavingKwh.toLocaleString("en-US")} kWh/yr`
									: item?.energySavingPercent !== null &&
											item?.energySavingPercent !== undefined
										? `${item.energySavingPercent}%`
										: "Not reported",
							tone: "positive",
						},
						{
							label: "Completion year",
							value:
								item?.completionYear !== null &&
								item?.completionYear !== undefined
									? String(item.completionYear)
									: "Not reported",
						},
					]}
				/>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Project detail</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 text-sm">
					{item?.description ? (
						<p className="whitespace-pre-line leading-relaxed text-muted-foreground">
							{item.description}
						</p>
					) : (
						<p className="text-muted-foreground">
							No written description is on file for this project.
						</p>
					)}

					<dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
						{facts.map((fact) => {
							const url = fact.documentUrl;
							return (
								<div
									key={fact.label}
									className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
								>
									<dt className="text-muted-foreground">{fact.label}</dt>
									<dd className="text-right font-medium text-foreground">
										{url ? (
											<button
												type="button"
												className="cursor-pointer font-medium text-blue-700 hover:underline"
												onClick={() => window.open(url, "_blank", "noopener")}
											>
												{fact.value}
											</button>
										) : (
											fact.value
										)}
									</dd>
								</div>
							);
						})}
					</dl>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon
							icon={faChartColumn}
							className="text-emerald-700"
						/>
						Reported monitoring
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 text-sm">
					<p className="text-muted-foreground">
						What each monitoring period measured, as the reports filed for this
						project recorded it.
					</p>

					{isLoading ? (
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<ShimmerBlock className="aspect-[16/9] w-full" />
							<ShimmerBlock className="aspect-[16/9] w-full" />
						</div>
					) : periods.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faChartColumn} />}
							title="No monitoring period reported"
							description="No monitoring period has been reported for this project yet."
						/>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">
									Energy saved {formatCount(item?.reportedEnergySavedKwh)} kWh
								</Badge>
								<Badge variant="secondary">
									Carbon abated {formatTonnes(item?.reportedCarbonAbatedTons)}
								</Badge>
							</div>

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
								<div>
									<h3 className="mb-2 font-semibold text-foreground">
										{ENERGY_SERIES}
									</h3>
									<BarChart
										data={energyData}
										xDataKey="period"
										aspectRatio="16 / 9"
									>
										<Grid horizontal />
										<Bar
											dataKey={ENERGY_SERIES}
											fill="var(--chart-1)"
											lineCap="round"
										/>
										<BarXAxis />
										<ChartTooltip />
									</BarChart>
								</div>
								<div>
									<h3 className="mb-2 font-semibold text-foreground">
										{CARBON_SERIES}
									</h3>
									<BarChart
										data={carbonData}
										xDataKey="period"
										aspectRatio="16 / 9"
									>
										<Grid horizontal />
										<Bar
											dataKey={CARBON_SERIES}
											fill="var(--chart-3)"
											lineCap="round"
										/>
										<BarXAxis />
										<ChartTooltip />
									</BarChart>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</DetailShell>
	);
}
