import {
	faCheckCircle,
	faDownload,
	faFileAlt,
	faSearch,
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
	Input,
	PaginationBar,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { REPORT_STATUS_META } from "../lib/labels";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function BrokerMonthlyReportsPage() {
	const { monthlyReports, isLoading, isError, refetch } = useBrokerData();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredReports = monthlyReports.filter(
		(r) =>
			r.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.period.includes(searchQuery),
	);

	const {
		pageRows,
		pageIndex,
		pageSize,
		pageCount,
		total,
		setPageIndex,
		setPageSize,
	} = usePagedRows(filteredReports);

	if (isError) {
		return (
			<EmptyState
				tone="error"
				title="Monitoring reports did not load"
				description="GET /api/broker/reports did not answer, so no verified monitoring period could be read."
				action={
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="relative w-full sm:max-w-md">
				<FontAwesomeIcon
					icon={faSearch}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
				/>
				<Input
					placeholder="Search by project name, company, or period (e.g. 2026-08)..."
					className="pl-9"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className="space-y-6">
					{Array.from({ length: 2 }, (_, index) => (
						<ShimmerBlock key={index} className="h-80 w-full" />
					))}
				</div>
			) : (
				<div className="space-y-6">
					{filteredReports.length === 0 && (
						<EmptyState
							icon={<FontAwesomeIcon icon={faFileAlt} />}
							title="No monitoring reports"
							description={
								searchQuery
									? `No report matches "${searchQuery}". Clear the search to see every report.`
									: "GreenShift publishes a report after each verified monitoring period. Reports for your assigned projects appear here once the first period closes."
							}
						/>
					)}
					{pageRows.map((report) => {
						const status = REPORT_STATUS_META[report.overallStatus];
						return (
							<Card key={report.id} className="overflow-hidden">
								<CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 pb-4">
									<div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">Period: {report.period}</Badge>
											<Badge className={status.className}>{status.label}</Badge>
										</div>
										<CardTitle className="mt-2 text-lg">
											{report.projectTitle}
										</CardTitle>
										<p className="mt-0.5 text-sm text-muted-foreground">
											Client: {report.companyName} • Contractor / Vendor:{" "}
											{report.vendorName}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<Link
											to="/broker/monthly-reports/$id"
											params={{ id: report.id }}
										>
											<Button variant="outline" size="sm" className="gap-1.5">
												<FontAwesomeIcon icon={faFileAlt} />
												View Full Report
											</Button>
										</Link>
										<Button
											size="sm"
											className="gap-1.5 bg-[#00712D] text-white hover:bg-[#00712D]/90"
											onClick={() =>
												report.pdfExportUrl &&
												window.location.assign(report.pdfExportUrl)
											}
										>
											<FontAwesomeIcon icon={faDownload} />
											Download Report PDF
										</Button>
									</div>
								</CardHeader>

								<CardContent className="space-y-6 p-6 text-sm">
									<div className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 sm:grid-cols-4">
										<div>
											<p className="text-muted-foreground">Physical Progress</p>
											<p className="mt-0.5 text-sm font-bold text-foreground">
												{report.actualProgressPercent}% (Target:{" "}
												{report.plannedProgressPercent}%)
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">
												Financial Expenditure
											</p>
											<p className="mt-0.5 text-sm font-bold text-foreground">
												{formatRupiah(report.actualSpendingAmount)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">
												Actual Energy Savings
											</p>
											<p className="mt-0.5 text-sm font-bold text-emerald-700">
												{report.actualEnergySavingsKwh.toLocaleString("en-US")}{" "}
												kWh
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">
												Carbon Emission Reduction
											</p>
											<p className="mt-0.5 text-sm font-bold text-emerald-700">
												{report.actualCarbonReductionTons} tCO₂e
											</p>
										</div>
									</div>

									<div className="space-y-3">
										<div className="space-y-1 rounded-lg border border-border p-3">
											<p className="font-semibold text-foreground">
												Official Monitoring Verdict:
											</p>
											<p className="leading-relaxed text-muted-foreground">
												{report.overallConclusion}
											</p>
										</div>

										{report.detectedRisksOrAnomalies.length > 0 && (
											<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
												<p className="flex items-center gap-1.5 font-semibold">
													<FontAwesomeIcon
														icon={faCheckCircle}
														className="text-emerald-700"
													/>
													Additional Monitoring Notes:
												</p>
												<ul className="mt-1 list-disc space-y-0.5 pl-5">
													{report.detectedRisksOrAnomalies.map((risk) => (
														<li key={risk}>{risk}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
					<PaginationBar
						label="Monthly reports"
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						total={total}
						onPageIndexChange={setPageIndex}
						onPageSizeChange={setPageSize}
					/>
				</div>
			)}
		</div>
	);
}
