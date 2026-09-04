import type { EmissionSummary } from "@greenshift/api/contracts";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { formatDate, formatNumber, formatTonnes } from "../lib/format";
import { STATUS_BADGE_CLASS } from "../lib/labels";

export interface EmissionRow {
	report: EmissionSummary;
	projectTitle: string;
}

interface EmissionsTableProps {
	title: string;
	rows: EmissionRow[];
}

export function EmissionsTable({ title, rows }: EmissionsTableProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
					<Table className="text-base">
						<TableHeader>
							<TableRow>
								<TableHead>Proyek</TableHead>
								<TableHead>Periode</TableHead>
								<TableHead className="text-right">Baseline</TableHead>
								<TableHead className="text-right">Aktual</TableHead>
								<TableHead className="text-right">Reduksi</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map(({ report, projectTitle }) => (
								<TableRow key={report.id}>
									<TableCell>
										<p className="font-medium">{projectTitle}</p>
									</TableCell>
									<TableCell className="tabular-nums">
										{report.periodEnd ? formatDate(report.periodEnd) : "—"}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatNumber(report.baselineConsumption)} kWh
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatNumber(report.actualConsumption)} kWh
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatTonnes(report.emissionReduction)}
									</TableCell>
									<TableCell>
										{report.anomalyFlagged === true ? (
											<Badge
												variant="destructive"
												className={STATUS_BADGE_CLASS}
											>
												Anomali
											</Badge>
										) : (
											<Badge variant="secondary" className={STATUS_BADGE_CLASS}>
												Normal
											</Badge>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
