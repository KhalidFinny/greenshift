import {
	faArrowLeft,
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
} from "@greenshift/ui";
import { Link, useParams } from "@tanstack/react-router";

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
	const { monthlyReports, isLoading } = useBrokerData();

	const report = monthlyReports.find((r) => r.id === id) ?? monthlyReports[0];

	// Reports load asynchronously; render a placeholder until one is available.
	if (!report) {
		return (
			<div className="space-y-4">
				<Link to="/broker/monthly-reports">
					<Button variant="ghost" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to Monthly Reports
					</Button>
				</Link>
				<Card>
					<CardContent className="p-8 text-center text-sm text-muted-foreground">
						{isLoading
							? "Loading the monitoring report..."
							: "This report is not available for an assigned project."}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!report) {
		return (
			<div className="p-8 text-center">
				<p className="text-muted-foreground">Report not found.</p>
				<Link to="/broker/monthly-reports">
					<Button className="mt-4 bg-[#03442C] text-white">
						Back to Reports List
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back Link & Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link
						to="/broker/monthly-reports"
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
					>
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to Monthly Reports
					</Link>
					<h1 className="text-2xl font-bold">{report.projectTitle}</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Monthly Monitoring Report Period:{" "}
						<span className="font-semibold text-foreground">
							{report.period}
						</span>
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-1.5 text-xs"
						onClick={() =>
							report.pdfExportUrl && window.location.assign(report.pdfExportUrl)
						}
					>
						<FontAwesomeIcon icon={faDownload} />
						Download Official PDF Report
					</Button>
				</div>
			</div>

			{/* Executive Summary Card */}
			<Card className="overflow-hidden border-t-4 border-t-[#03442C]">
				<CardHeader className="bg-muted/30 pb-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Badge className="bg-[#03442C] text-white font-bold">
								Report ID: {report.id}
							</Badge>
							<Badge
								className={
									report.overallStatus === "ON_TRACK"
										? "bg-emerald-600 text-white font-bold"
										: report.overallStatus === "ATTENTION_REQUIRED"
											? "bg-amber-600 text-white font-bold"
											: "bg-red-600 text-white font-bold"
								}
							>
								Monitoring Status: {report.overallStatus.replace(/_/g, " ")}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							Reported Date:{" "}
							{new Date(report.submittedAt).toLocaleDateString("en-US", {
								dateStyle: "long",
							})}
						</p>
					</div>
				</CardHeader>

				<CardContent className="p-6 space-y-6">
					{/* Stakeholders Info */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-muted/50 p-4 text-xs">
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

					{/* Key Metrics Breakdown */}
					<div>
						<h3 className="text-sm font-semibold mb-3">
							Key Performance Summary
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Physical Progress</span>
									<FontAwesomeIcon
										icon={faProjectDiagram}
										className="text-emerald-600"
									/>
								</div>
								<div className="text-xl font-bold text-foreground">
									{report.actualProgressPercent}%
								</div>
								<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
									<div
										className="bg-emerald-600 h-full rounded-full"
										style={{
											width: `${Math.min(report.actualProgressPercent, 100)}%`,
										}}
									/>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Planned Target: {report.plannedProgressPercent}%
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Financial Expenditure</span>
									<FontAwesomeIcon
										icon={faMoneyBillWave}
										className="text-emerald-600"
									/>
								</div>
								<div className="text-xl font-bold text-foreground">
									{formatRupiah(report.actualSpendingAmount)}
								</div>
								<p className="text-[11px] text-muted-foreground">
									Planned Budget: {formatRupiah(report.plannedBudgetAmount)}
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Energy Savings (kWh)</span>
									<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
								</div>
								<div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
									{report.actualEnergySavingsKwh.toLocaleString("en-US")}
								</div>
								<p className="text-[11px] text-muted-foreground">
									Target:{" "}
									{report.expectedEnergySavingsKwh.toLocaleString("en-US")} kWh
								</p>
							</div>

							<div className="rounded-xl border border-border p-4 space-y-2 bg-card">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Emission Reduction (tCO₂e)</span>
									<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
								</div>
								<div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
									{report.actualCarbonReductionTons}
								</div>
								<p className="text-[11px] text-muted-foreground">
									Target: {report.expectedCarbonReductionTons} tCO₂e
								</p>
							</div>
						</div>
					</div>

					{/* Milestone & Detailed Performance */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<FontAwesomeIcon icon={faClock} className="text-[#03442C]" />
									Milestone Status & Field Execution
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-xs">
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
									<span className="font-semibold text-emerald-600">
										{report.actualRoiPerformancePercent}% (Projected Target:{" "}
										{report.projectedRoiPercent}%)
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<FontAwesomeIcon
										icon={faShieldAlt}
										className="text-[#03442C]"
									/>
									Supervision & Risk Management Notes
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-xs">
								{report.detectedRisksOrAnomalies.length === 0 ? (
									<p className="text-muted-foreground">
										No anomalies or significant risks detected for this period.
									</p>
								) : (
									<ul className="space-y-2">
										{report.detectedRisksOrAnomalies.map((risk, idx) => (
											<li
												key={idx}
												className="flex items-start gap-2 bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200"
											>
												<FontAwesomeIcon
													icon={faCheckCircle}
													className="text-emerald-600 mt-0.5 shrink-0"
												/>
												<span>{risk}</span>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Official Conclusion Box */}
					<div className="rounded-xl border border-border p-4 bg-muted/30 space-y-2 text-xs">
						<p className="font-semibold text-foreground text-sm flex items-center gap-2">
							<FontAwesomeIcon icon={faFileAlt} className="text-[#03442C]" />
							Official Monitoring Performance Verdict
						</p>
						<p className="text-muted-foreground leading-relaxed">
							{report.overallConclusion}
						</p>
						<p className="text-[11px] text-muted-foreground italic pt-2 border-t border-border mt-3">
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
