import {
	faBuildingColumns,
	faCircleCheck,
	faClock,
	faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Bar,
	BarChart,
	BarXAxis,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	ContentSkeleton,
	EmptyState,
	Grid,
} from "@greenshift/ui";
import { PaymentsTable, type PaymentRow } from "../organisms/payments-table";
import { StatCards } from "../organisms/stat-cards";
import { roiFlowByQuarter } from "../lib/chart-series";
import { downloadCsv } from "../lib/csv";
import { formatDate, formatIdr } from "../lib/format";
import { useInvestorData } from "../lib/use-investor-data";

export function TransactionsTab() {
	const { details, isPending, isError } = useInvestorData();

	if (isPending) return <ContentSkeleton />;
	if (isError) {
		return (
			<EmptyState
				title="Gagal memuat transaksi"
				description="Tidak dapat mengambil jadwal ROI dan escrow Anda saat ini."
			/>
		);
	}

	const payments: PaymentRow[] = details.flatMap((detail) =>
		detail.payments.map((payment) => ({
			...payment,
			projectTitle: detail.project.title,
		})),
	);

	if (payments.length === 0) {
		return (
			<EmptyState
				title="Belum ada jadwal ROI"
				description="Jadwal pembayaran ROI kuartalan dibuat otomatis saat Anda membeli obligasi, lalu dicairkan melalui escrow sandbox."
			/>
		);
	}

	const paidSum = payments
		.filter((payment) => payment.status === "paid")
		.reduce((sum, payment) => sum + payment.amount, 0);
	const scheduledCount = payments.filter(
		(payment) => payment.status === "scheduled",
	).length;
	const escrowCount = payments.filter((payment) => payment.escrowTxId).length;
	const flow = roiFlowByQuarter(payments);

	const downloadHistory = () =>
		downloadCsv(
			`riwayat-escrow-${new Date().toISOString().slice(0, 10)}.csv`,
			["Periode", "Proyek", "Jumlah", "Status", "Ref Escrow", "Dibayar"],
			payments.map((payment) => [
				payment.period,
				payment.projectTitle,
				payment.amount,
				payment.status,
				payment.escrowTxId,
				payment.paidAt ? formatDate(payment.paidAt) : "",
			]),
		);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Arus ROI per Kuartal</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<BarChart
							data={flow}
							xDataKey="label"
							className="aspect-[7/2]! xl:aspect-[5/3]!"
						>
							<Grid horizontal />
							<Bar dataKey="paid" fill="var(--chart-2)" lineCap="round" />
							<Bar
								dataKey="scheduled"
								fill="var(--chart-5)"
								lineCap="round"
							/>
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					</CardContent>
				</Card>

				<StatCards
					items={[
						{
							label: "ROI diterima",
							value: formatIdr(paidSum),
							sub: "dibayar via escrow sandbox",
							icon: faCircleCheck,
							tone: "positive",
						},
						{
							label: "Menunggu pembayaran",
							value: String(scheduledCount),
							sub: "pembayaran kuartalan",
							icon: faClock,
						},
						{
							label: "Transaksi escrow",
							value: String(escrowCount),
							sub: "riwayat dapat diunduh",
							icon: faBuildingColumns,
						},
					]}
				/>
			</div>

			<PaymentsTable
				title="Rincian Jadwal & Escrow"
				rows={payments}
				action={
					<Button variant="outline" onClick={downloadHistory}>
						<FontAwesomeIcon icon={faDownload} />
						Unduh CSV
					</Button>
				}
			/>
		</div>
	);
}
