import {
	faCheckCircle,
	faDownload,
	faFileAlt,
	faFilter,
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
	Input,
} from "@greenshift/ui";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function BrokerMonthlyReportsPage() {
	const { monthlyReports } = useBrokerData();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredReports = monthlyReports.filter(
		(r) =>
			r.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.period.includes(searchQuery),
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Monthly Monitoring Reports</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Verified project performance reports to support investment reporting to external green bond investors. (Read-Only)
				</p>
			</div>

			{/* Search & Filter */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
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
				<Button variant="outline" className="gap-2 shrink-0">
					<FontAwesomeIcon icon={faFilter} />
					Filter Period
				</Button>
			</div>

			<div className="space-y-6">
				{filteredReports.map((report) => (
					<Card key={report.id} className="overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 pb-4">
							<div>
								<div className="flex items-center gap-2">
									<Badge className="bg-[#03442C] text-white font-bold">
										Period: {report.period}
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
										Project Status: {report.overallStatus.replace(/_/g, " ")}
									</Badge>
								</div>
								<CardTitle className="mt-2 text-lg">{report.projectTitle}</CardTitle>
								<p className="text-xs text-muted-foreground mt-0.5">
									Client: {report.companyName} • Contractor / Vendor: {report.vendorName}
								</p>
							</div>

							<div className="flex items-center gap-2">
								<Link to="/broker/monthly-reports/$id" params={{ id: report.id }}>
									<Button variant="outline" size="sm" className="gap-1.5 text-xs">
										<FontAwesomeIcon icon={faFileAlt} />
										View Full Report
									</Button>
								</Link>
								<Button size="sm" className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-1.5 text-xs">
									<FontAwesomeIcon icon={faDownload} />
									Download Report PDF
								</Button>
							</div>
						</CardHeader>

						<CardContent className="p-6 space-y-6 text-xs">
							{/* Summary Cards */}
							<div className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 sm:grid-cols-4">
								<div>
									<p className="text-muted-foreground">Physical Progress</p>
									<p className="font-bold text-foreground text-sm mt-0.5">
										{report.actualProgressPercent}% (Target: {report.plannedProgressPercent}%)
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Financial Expenditure</p>
									<p className="font-bold text-foreground text-sm mt-0.5">
										{formatRupiah(report.actualSpendingAmount)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Actual Energy Savings</p>
									<p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
										{report.actualEnergySavingsKwh.toLocaleString("en-US")} kWh
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Carbon Emission Reduction</p>
									<p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
										{report.actualCarbonReductionTons} tCO₂e
									</p>
								</div>
							</div>

							{/* Overall Conclusion & Anomaly alerts */}
							<div className="space-y-3">
								<div className="rounded-lg border border-border p-3 space-y-1">
									<p className="font-semibold text-foreground">Official Monitoring Verdict:</p>
									<p className="text-muted-foreground leading-relaxed">
										{report.overallConclusion}
									</p>
								</div>

								{report.detectedRisksOrAnomalies.length > 0 && (
									<div className="rounded-lg bg-emerald-50 p-3 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200">
										<p className="font-semibold flex items-center gap-1.5">
											<FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
											Additional Monitoring Notes:
										</p>
										<ul className="list-disc pl-5 mt-1 space-y-0.5">
											{report.detectedRisksOrAnomalies.map((risk, idx) => (
												<li key={idx}>{risk}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
