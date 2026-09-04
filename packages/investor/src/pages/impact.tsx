import {
	faFileLines,
	faLeaf,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
	Bar,
	BarChart,
	BarXAxis,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	ContentSkeleton,
	EmptyState,
	Grid,
} from "@greenshift/ui";
import { EmissionsTable, type EmissionRow } from "../organisms/emissions-table";
import { StatCards } from "../organisms/stat-cards";
import { reductionsByQuarter } from "../lib/chart-series";
import { formatTonnes } from "../lib/format";
import { useInvestorData } from "../lib/use-investor-data";

export function ImpactTab() {
	const { details, isPending, isError } = useInvestorData();

	if (isPending) return <ContentSkeleton />;
	if (isError) {
		return (
			<EmptyState
				title="Gagal memuat laporan dampak"
				description="Tidak dapat mengambil laporan MRV proyek Anda saat ini."
			/>
		);
	}

	const rows: EmissionRow[] = details.flatMap((detail) =>
		detail.emissionReports.map((report) => ({
			report,
			projectTitle: detail.project.title,
		})),
	);

	if (rows.length === 0) {
		return (
			<EmptyState
				title="Belum ada laporan MRV"
				description="Laporan reduksi emisi terverifikasi (periode, konsumsi aktual vs baseline) akan muncul setelah proyek yang Anda danai memasuki tahap monitoring."
			/>
		);
	}

	const reductionTotal = rows.reduce(
		(sum, row) => sum + (row.report.emissionReduction ?? 0),
		0,
	);
	const anomalyCount = rows.filter(
		(row) => row.report.anomalyFlagged === true,
	).length;
	const trend = reductionsByQuarter(
		rows.map((row) => ({
			periodEnd: row.report.periodEnd,
			emissionReduction: row.report.emissionReduction,
		})),
	);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Tren Reduksi Emisi</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<BarChart
							data={trend}
							xDataKey="label"
							className="aspect-[7/2]! xl:aspect-[5/3]!"
						>
							<Grid horizontal />
							<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					</CardContent>
				</Card>

				<StatCards
					items={[
						{
							label: "Reduksi CO₂e terlapor",
							value: formatTonnes(reductionTotal),
							sub: "akumulasi laporan MRV",
							icon: faLeaf,
						},
						{
							label: "Laporan MRV",
							value: String(rows.length),
							sub: "periode terverifikasi",
							icon: faFileLines,
						},
						{
							label: "Anomali terdeteksi",
							value: String(anomalyCount),
							sub: "perlu pemeriksaan teknis",
							icon: faTriangleExclamation,
							tone: anomalyCount > 0 ? "destructive" : "default",
						},
					]}
				/>
			</div>

			<EmissionsTable title="Rincian Laporan MRV" rows={rows} />
		</div>
	);
}
