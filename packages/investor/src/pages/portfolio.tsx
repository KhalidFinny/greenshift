import {
	faBriefcase,
	faChartLine,
	faCoins,
	faPercent,
} from "@fortawesome/free-solid-svg-icons";
import {
	ContentSkeleton,
	EmptyState,
} from "@greenshift/ui";
import { HoldingsPanel } from "../organisms/holdings-panel";
import { MetricCard } from "../organisms/metric-card";
import { PortfolioDonutCard } from "../organisms/portfolio-donut-card";
import { formatIdr } from "../lib/format";
import { portfolioTotals, investedBySector } from "../lib/portfolio-metrics";
import { useInvestorData } from "../lib/use-investor-data";

export function InvestorPortfolioPage() {
	const { items, details, isPending, isError, isDemo } = useInvestorData();

	if (isPending) return <ContentSkeleton />;
	if (isError) {
		return (
			<EmptyState
				title="Gagal memuat portofolio"
				description="Tidak dapat mengambil data obligasi Anda saat ini."
			/>
		);
	}

	const totals = portfolioTotals(items);
	const payments = details.flatMap((detail) => detail.payments);
	const paidSum = payments
		.filter((payment) => payment.status === "paid")
		.reduce((sum, payment) => sum + payment.amount, 0);
	const scheduledSum = payments
		.filter((payment) => payment.status === "scheduled")
		.reduce((sum, payment) => sum + payment.amount, 0);
	const totalFlow = paidSum + scheduledSum;
	const paidShare = totalFlow > 0 ? Math.round((paidSum / totalFlow) * 100) : 0;
	const sectors = investedBySector(items);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Total Investasi"
					value={formatIdr(totals.invested)}
					sub={`${items.length} obligasi`}
					icon={faCoins}
				/>
				<MetricCard
					label="ROI Diterima"
					value={formatIdr(totals.roiPaid)}
					sub="escrow tercatat"
					icon={faChartLine}
				/>
				<MetricCard
					label="IRR Rata-rata"
					value={
						totals.irrAverage !== null
							? `${totals.irrAverage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
							: "—"
					}
					sub="dari blueprint aktif"
					icon={faPercent}
				/>
				<MetricCard
					label="Obligasi Aktif"
					value={`${totals.activeBonds}/${items.length}`}
					sub={`${totals.projects} proyek`}
					icon={faBriefcase}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<PortfolioDonutCard
					title="Arus ROI Portofolio"
					centerValue={`${paidShare}%`}
					centerLabel="dibayar"
					slices={[
						{
							label: "Dibayar",
							value: paidSum,
							display: formatIdr(paidSum),
							color: "var(--chart-2)",
						},
						{
							label: "Terjadwal",
							value: scheduledSum,
							display: formatIdr(scheduledSum),
							color: "var(--chart-5)",
						},
					]}
				/>

				<PortfolioDonutCard
					title="Alokasi per Sektor"
					centerValue={String(sectors.length)}
					centerLabel="sektor"
					slices={sectors.map((slice, index) => ({
						label: slice.sector,
						value: slice.amount,
						display: `${Math.round(slice.share * 100)}%`,
						color: `var(--chart-${Math.min(index + 1, 5)})`,
					}))}
				/>
			</div>

			<HoldingsPanel
				items={items}
				interactive={!isDemo}
				title="Daftar Obligasi"
			/>
		</div>
	);
}
