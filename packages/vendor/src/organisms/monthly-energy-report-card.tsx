import { faLeaf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import type { MonthlyEnergyReport } from "../lib/types";

interface MonthlyEnergyReportCardProps {
	reports: MonthlyEnergyReport[];
}

export function MonthlyEnergyReportCard({ reports }: MonthlyEnergyReportCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
					Periodic Energy & Carbon Reporting (Broker Pipeline)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<p className="text-muted-foreground">
					Monthly verified energy savings and carbon abatement data feed into
					the downstream reporting pipeline for Brokers and Investors. Vendors
					track physical deliverables and operational data.
				</p>

				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex justify-between bg-muted px-4 py-3 font-semibold">
						<span>Reporting Period</span>
						<span>Energy Saved (kWh)</span>
						<span>Carbon Abatement (tCO₂e)</span>
						<span>Status</span>
					</div>
					<div className="divide-y divide-border">
						{reports.map((rep) => (
							<div
								key={rep.id}
								className="flex items-center justify-between p-4"
							>
								<span className="font-semibold">{rep.period}</span>
								<span>{rep.energySavedKwh.toLocaleString("en-US")} kWh</span>
								<span className="font-semibold text-emerald-600">
									{rep.carbonSavedTons} tCO₂e
								</span>
								<Badge className="bg-emerald-600 text-white">
									Reported & Verified
								</Badge>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
