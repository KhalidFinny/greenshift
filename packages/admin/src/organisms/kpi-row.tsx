import {
	faBuilding,
	faChartLine,
	faIndustry,
	faSeedling,
} from "@fortawesome/free-solid-svg-icons";
import { MetricCard } from "./metric-card";

const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

interface KpiRowProps {
	companies: number;
	activeProjects: number;
	totalProjects: number;
	projectValue: number;
	totalBonds: number;
	co2Reduction: number;
}

export function KpiRow({
	companies,
	activeProjects,
	totalProjects,
	projectValue,
	totalBonds,
	co2Reduction,
}: KpiRowProps) {
	const cards = [
		{
			label: "Total Organisasi",
			value: String(companies),
			icon: faBuilding,
			sub: `${companies} perusahaan terdaftar`,
		},
		{
			label: "Proyek Aktif",
			value: String(activeProjects),
			icon: faIndustry,
			sub: `${totalProjects} total`,
		},
		{
			label: "Reduksi CO₂",
			value: `${co2Reduction} ton`,
			icon: faSeedling,
			sub: "target 100 ton/tahun",
		},
		{
			label: "Nilai Proyek",
			value: idr.format(projectValue),
			icon: faChartLine,
			sub: `${totalBonds} obligasi`,
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{cards.map((card) => (
				<MetricCard
					key={card.label}
					label={card.label}
					value={card.value}
					sub={card.sub}
					icon={card.icon}
				/>
			))}
		</div>
	);
}
