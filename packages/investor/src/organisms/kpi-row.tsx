import { faBriefcase, faChartLine, faLeaf, faPercent } from "@fortawesome/free-solid-svg-icons";
import { formatIdr, formatTonnes } from "../lib/format";
import type { PortfolioTotals } from "../lib/portfolio-metrics";
import { MetricCard } from "./metric-card";

interface KpiRowProps {
	totals: PortfolioTotals;
	bondCount: number;
}

export function KpiRow({ totals, bondCount }: KpiRowProps) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			<MetricCard
				label="ROI Diterima"
				value={formatIdr(totals.roiPaid)}
				sub="distribusi via escrow sandbox"
				icon={faChartLine}
			/>
			<MetricCard
				label="IRR Rata-rata"
				value={
					totals.irrAverage !== null
						? `${totals.irrAverage.toLocaleString("id-ID", {
								maximumFractionDigits: 1,
							})}%`
						: "—"
				}
				sub="proyeksi blueprint"
				icon={faPercent}
			/>
			<MetricCard
				label="Obligasi Aktif"
				value={`${totals.activeBonds}/${bondCount}`}
				sub={`${totals.projects} proyek didanai`}
				icon={faBriefcase}
			/>
			<MetricCard
				label="Target Reduksi CO₂e"
				value={formatTonnes(totals.targetReduction)}
				sub="target proyek per tahun"
				icon={faLeaf}
			/>
		</div>
	);
}
