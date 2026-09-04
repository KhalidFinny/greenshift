import { faLeaf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import { formatIdr, formatNumber, formatTonnes } from "../lib/format";
import type { PortfolioTotals } from "../lib/portfolio-metrics";

interface ClimateImpactCardProps {
	totals: PortfolioTotals;
	bondCount: number;
}

/**
 * Signature impact panel. Brand dark-forest green inline (agent.md
 * exception). All text solid white — no gray/translucent tones on the dark
 * surface. Rows are label-left / value-right and share the panel height
 * evenly (flex-1), with every value at the same type size.
 */
export function ClimateImpactCard({ totals, bondCount }: ClimateImpactCardProps) {
	const irrText =
		totals.irrAverage !== null
			? `${totals.irrAverage.toLocaleString("id-ID", {
					maximumFractionDigits: 1,
				})}%`
			: "—";

	const rows = [
		{ label: "Target reduksi tahunan", value: formatTonnes(totals.targetReduction) },
		{ label: "ROI dibagikan", value: formatIdr(totals.roiPaid) },
		{ label: "IRR rata-rata obligasi", value: irrText },
		{
			label: "Estimasi hemat energi",
			value: `${formatNumber(totals.energySaving)} kWh/thn`,
		},
		{
			label: "Proyek & sektor",
			value: `${totals.projects} proyek · ${totals.sectors} sektor`,
		},
		{
			label: "Obligasi aktif",
			value: `${totals.activeBonds}/${bondCount}`,
		},
	];

	return (
		<Card className="flex flex-col border-0 bg-[#03442C]">
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white">
						<FontAwesomeIcon icon={faLeaf} className="text-lg" />
					</div>
					<CardTitle className="text-xl text-white">
						Dampak Portofolio
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col divide-y divide-white/20 pt-0">
				{rows.map((row) => (
					<div
						key={row.label}
						className="flex flex-1 items-center justify-between gap-4 px-5"
					>
						<p className="min-w-0 text-base text-white">{row.label}</p>
						<p className="shrink-0 text-right text-xl font-semibold leading-none tabular-nums text-white">
							{row.value}
						</p>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
