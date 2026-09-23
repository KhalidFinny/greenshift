import { faFileAlt, faLeaf } from "@fortawesome/free-solid-svg-icons";
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
import type { MonthlyEnergyReport } from "../lib/types";

interface MonthlyEnergyReportCardProps {
	reports: MonthlyEnergyReport[];
	/** Reports still in flight: same card frame, shimmering rows. */
	loading?: boolean;
}

export function MonthlyEnergyReportCard({
	reports,
	loading = false,
}: MonthlyEnergyReportCardProps) {
	const paged = usePagedRows(reports);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
					Periodic Energy & Carbon Reporting (Broker Pipeline)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p className="text-muted-foreground">
					Monthly verified energy savings and carbon abatement data feed into
					the downstream reporting pipeline for Brokers and Investors. Vendors
					track physical deliverables and operational data.
				</p>

				{loading ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<ShimmerBlock key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				) : reports.length === 0 ? (
					<EmptyState
						icon={<FontAwesomeIcon icon={faFileAlt} />}
						title="No reporting periods recorded"
						description="Verified monthly energy and carbon figures are listed here once the client approves the first reporting period of this project."
					/>
				) : (
					<div className="overflow-hidden rounded-xl border border-border">
						<div className="flex justify-between bg-muted px-4 py-3 font-semibold">
							<span>Reporting Period</span>
							<span>Energy Saved (kWh)</span>
							<span>Carbon Abatement (tCO₂e)</span>
							<span>Status</span>
						</div>
						<div className="divide-y divide-border">
							{paged.pageRows.map((rep) => (
								<div
									key={rep.id}
									className="flex items-center justify-between p-4"
								>
									<span className="font-semibold">{rep.period}</span>
									<span>{rep.energySavedKwh.toLocaleString("en-US")} kWh</span>
									<span className="font-semibold text-emerald-700">
										{rep.carbonSavedTons} tCO₂e
									</span>
									<Badge className="bg-emerald-700 text-white">
										Reported & Verified
									</Badge>
								</div>
							))}
						</div>
					</div>
				)}

				<PaginationBar
					label="Reporting periods"
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
