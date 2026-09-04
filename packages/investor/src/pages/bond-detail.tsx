import {
	faArrowLeft,
	faChartLine,
	faCoins,
	faDownload,
	faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ContentSkeleton,
	EmptyState,
} from "@greenshift/ui";
import { EmissionsTable, type EmissionRow } from "../organisms/emissions-table";
import { MetricCard } from "../organisms/metric-card";
import { PaymentsTable, type PaymentRow } from "../organisms/payments-table";
import { downloadCsv } from "../lib/csv";
import { formatDate, formatIdr, formatTonnes, titleCase } from "../lib/format";
import {
	INVEST_STATUS_LABEL,
	INVEST_STATUS_TONE,
	STATUS_BADGE_CLASS,
} from "../lib/labels";

export function InvestorBondDetail({ investmentId }: { investmentId: number }) {
	const query = useQuery({
		queryKey: ["investor", "portfolio", "detail", investmentId],
		queryFn: () => api.investor.portfolioDetail(investmentId),
	});

	if (query.isPending) return <ContentSkeleton />;
	if (query.isError || !query.data) {
		return (
			<EmptyState
				title="Investasi tidak ditemukan"
				description="Obligasi tidak ditemukan atau bukan milik Anda."
			/>
		);
	}

	const { investment, project, blueprint, payments, emissionReports } =
		query.data;
	const paymentRows: PaymentRow[] = payments.map((payment) => ({
		...payment,
		projectTitle: project.title,
	}));
	const emissionRows: EmissionRow[] = emissionReports.map((report) => ({
		report,
		projectTitle: project.title,
	}));
	const emissionTotal = emissionRows.reduce(
		(sum, row) => sum + (row.report.emissionReduction ?? 0),
		0,
	);

	const downloadHistory = () =>
		downloadCsv(
			`escrow-${investment.bondSerialNumber ?? investment.id}.csv`,
			["Periode", "Jumlah", "Status", "Ref Escrow", "Dibayar"],
			payments.map((payment) => [
				payment.period,
				payment.amount,
				payment.status,
				payment.escrowTxId,
				payment.paidAt ? formatDate(payment.paidAt) : "",
			]),
		);

	return (
		<div className="space-y-6">
			<div>
				<Link
					to="/investor"
					className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
				>
					<FontAwesomeIcon icon={faArrowLeft} className="size-4" />
					Dashboard
				</Link>
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<h1 className="text-2xl font-semibold">{project.title}</h1>
					<Badge
						variant={INVEST_STATUS_TONE[investment.status] ?? "outline"}
						className={STATUS_BADGE_CLASS}
					>
						{INVEST_STATUS_LABEL[investment.status] ?? investment.status}
					</Badge>
					<Badge variant="secondary" className={STATUS_BADGE_CLASS}>
						{titleCase(project.industrySector ?? "Umum")}
					</Badge>
				</div>
				<p className="mt-1 text-base text-muted-foreground">
					Obligasi <span className="tabular-nums">{investment.bondSerialNumber ?? "—"}</span> ·
					diinvestasikan {formatDate(investment.investedAt)} · {project.location ?? "—"}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Nilai Investasi"
					value={formatIdr(investment.amount)}
					sub="pokok obligasi"
					icon={faCoins}
				/>
				<MetricCard
					label="ROI Diterima"
					value={formatIdr(investment.roiPaid)}
					sub="distribusi via escrow"
					icon={faChartLine}
				/>
				<MetricCard
					label="IRR Blueprint"
					value={
						typeof blueprint.irr === "number"
							? `${blueprint.irr.toLocaleString("id-ID", {
									maximumFractionDigits: 1,
								})}%`
							: "—"
					}
					sub={
						typeof blueprint.paybackPeriod === "number"
							? `payback ${blueprint.paybackPeriod} tahun`
							: "per tahun"
					}
					icon={faChartLine}
				/>
				<MetricCard
					label="Reduksi Terlapor"
					value={formatTonnes(emissionTotal)}
					sub="dari laporan MRV"
					icon={faLeaf}
				/>
			</div>

			<PaymentsTable
				title="Jadwal ROI & Escrow"
				rows={paymentRows}
				action={
					<Button variant="outline" onClick={downloadHistory}>
						<FontAwesomeIcon icon={faDownload} />
						Unduh CSV
					</Button>
				}
			/>

			{emissionRows.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Laporan MRV</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-base text-muted-foreground">
							Belum ada laporan reduksi emisi untuk proyek ini.
						</p>
					</CardContent>
				</Card>
			) : (
				<EmissionsTable title="Laporan MRV Proyek" rows={emissionRows} />
			)}
		</div>
	);
}
