import {
	faCheckCircle,
	faClock,
	faDownload,
	faFileAlt,
	faLeaf,
	faMoneyBillWave,
	faProjectDiagram,
	faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";
import { Link, useParams } from "@tanstack/react-router";

import { REPORT_STATUS_META } from "../lib/labels";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function BrokerReportDetailPage() {
	const { id } = useParams({ strict: false }) as { id?: string };
	const { monthlyReports, isLoading, isError, refetch } = useBrokerData();

	const report = monthlyReports.find((r) => r.id === id) ?? monthlyReports[0];

	if (!report) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link to="/broker/monthly-reports">
						<Button variant="outline" className="cursor-pointer font-medium">
							Back to Monthly Reports
						</Button>
					</Link>
				</div>
				{isError ? (
					<EmptyState
						tone="error"
						title="Monitoring reports did not load"
						description="GET /api/broker/reports did not answer, so this period report could not be read."
						action={
							<Button variant="outline" onClick={() => void refetch()}>
								Try again
							</Button>
						}
					/>
				) : isLoading ? (
					<Card>
						<CardContent className="space-y-4">
							<ShimmerBlock className="h-9 w-2/3" />
							<ShimmerBlock className="h-5 w-1/3" />
							<ShimmerBlock className="h-28 w-full" />
						</CardContent>
					</Card>
				) : (
					<EmptyState
						tone="error"
						icon={<FontAwesomeIcon icon={faFileAlt} />}
						title="Report not available"
						description="No monitoring report with this id belongs to a project assigned to your brokerage. Reports appear here once GreenShift publishes a monitoring period for an assigned project."
					/>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link to="/broker/monthly-reports">
						<Button
							variant="outline"
							className="mb-2 cursor-pointer font-medium"
						>
							Back to Monthly Reports
						</Button>
					</Link>
					<h1 className="text-2xl font-bold">{report.projectTitle}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Monthly Monitoring Report Period:{" "}
						<span className="font-semibold text-foreground">
							{report.period}
						</span>
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="gap-1.5 bg-[#00712D] text-white hover:bg-[#00712D]/90"
						onClick={() =>
							report.pdfExportUrl && window.location.assign(report.pdfExportUrl)
						}
					>
						<FontAwesomeIcon icon={faDownload} />
						Download Official PDF Report
					</Button>
				</div>
			</div>

			<Card className="overflow-hidden">
				<CardHeader className="bg-muted/30 pb-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Badge variant="outline">Report ID: {report.id}</Badge>
							<Badge
								className={REPORT_STATUS_META[report.overallStatus].className}
							>
								Monitoring Status:{" "}
								{REPORT_STATUS_META[report.overallStatus].label}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">
							Reported Date:{" "}
							{new Date(report.submittedAt).toLocaleDateString("en-US", {
								dateStyle: "long",
							})}
						</p>
					</div>
				</CardHeader>

				<CardContent className="p-6 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-muted/50 p-4 text-sm">
						<div>
							<p className="text-muted-foreground">Project Owner (Company)</p>
							<p className="font-semibold text-foreground text-sm mt-0.5">
								{report.companyName}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">
								General Contractor / Vendor
							</p>
							<p className="font-semibold text-foreground text-sm mt-0.5">
								{report.vendorName}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Reference Project ID</p>
							<p className="font-semibold text-foreground text-sm mt-0.5">
								{report.projectId}
							</p>
						</div>
					</div>

					<div>
						<h3 className="text-sm font-semibold mb-3">
							Key Performance Summary
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-sm">
									<span>Physical Progress</span>
									<FontAwesomeIcon
										icon={faProjectDiagram}
										className="text-emerald-700"
									/>
								</div>
								<div className="text-xl font-bold text-foreground">
									{report.actualProgressPercent}%
								</div>
								<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
									<div
										className="bg-emerald-700 h-full rounded-full"
										style={{
											width: `${Math.min(report.actualProgressPercent, 100)}%`,
										}}
									/>
								</div>
								<p className="text-sm text-muted-foreground">
									Planned Target: {report.plannedProgressPercent}%
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-sm">
									<span>Financial Expenditure</span>
									<FontAwesomeIcon
										icon={faMoneyBillWave}
										className="text-emerald-700"
									/>
								</div>
								<div className="text-xl font-bold text-foreground">
									{formatRupiah(report.actualSpendingAmount)}
								</div>
								<p className="text-sm text-muted-foreground">
									Planned Budget: {formatRupiah(report.plannedBudgetAmount)}
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-sm">
									<span>Energy Savings (kWh)</span>
									<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
								</div>
								<div className="text-xl font-bold text-emerald-700">
									{report.actualEnergySavingsKwh.toLocaleString("en-US")}
								</div>
								<p className="text-sm text-muted-foreground">
									Target:{" "}
									{report.expectedEnergySavingsKwh.toLocaleString("en-US")} kWh
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-sm">
									<span>Emission Reduction (tCO₂e)</span>
									<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
								</div>
								<div className="text-xl font-bold text-emerald-700">
									{report.actualCarbonReductionTons}
								</div>
								<p className="text-sm text-muted-foreground">
									Target: {report.expectedCarbonReductionTons} tCO₂e
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<FontAwesomeIcon icon={faClock} className="text-[#03442C]" />
									Milestone Status & Field Execution
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="flex justify-between items-center py-2 border-b border-border">
									<span className="text-muted-foreground">
										Current Milestone:
									</span>
									<span className="font-semibold">
										{report.currentMilestoneTitle}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border">
									<span className="text-muted-foreground">
										Completed Milestones:
									</span>
									<span className="font-semibold">
										{report.completedMilestonesCount} Milestones
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border">
									<span className="text-muted-foreground">
										Actual ROI Performance:
									</span>
									<span className="font-semibold text-emerald-700">
										{report.actualRoiPerformancePercent}% (Projected Target:{" "}
										{report.projectedRoiPercent}%)
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<FontAwesomeIcon
										icon={faShieldAlt}
										className="text-[#03442C]"
									/>
									Supervision & Risk Management Notes
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								{report.detectedRisksOrAnomalies.length === 0 ? (
									<EmptyState
										icon={<FontAwesomeIcon icon={faCheckCircle} />}
										title="No anomalies this period"
										description="Field supervision and telemetry recorded no risks or anomalies for this monitoring period."
									/>
								) : (
									<ul className="space-y-2">
										{report.detectedRisksOrAnomalies.map((risk, idx) => (
											<li
												key={idx}
												className="flex items-start gap-2 bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200"
											>
												<FontAwesomeIcon
													icon={faCheckCircle}
													className="text-emerald-700 mt-0.5 shrink-0"
												/>
												<span>{risk}</span>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>

					<div className="rounded-xl border border-border p-4 bg-muted/30 space-y-2 text-sm">
						<p className="font-semibold text-foreground text-sm flex items-center gap-2">
							<FontAwesomeIcon icon={faFileAlt} className="text-[#03442C]" />
							Official Monitoring Performance Verdict
						</p>
						<p className="text-muted-foreground leading-relaxed">
							{report.overallConclusion}
						</p>
						<p className="text-sm text-muted-foreground italic pt-2 border-t border-border mt-3">
							Note: This report is transparently sourced from telemetry data and
							on-site audits to serve as reporting material for external
							investors holding Green Bonds.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
