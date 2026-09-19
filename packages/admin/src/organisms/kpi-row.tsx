import {
	faBuilding,
	faChartLine,
	faIndustry,
	faSeedling,
} from "@fortawesome/free-solid-svg-icons";
import { MetricCard } from "./metric-card";

const idr = new Intl.NumberFormat("en-US", {
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
	/** Tonnes of CO2e measured by the MRV reports on file. */
	co2Reduction: number;
	/** Tonnes of CO2e the submitted projects target in total. */
	co2Target: number;
	/** Data still in flight: same four cards, shimmering values. */
	loading?: boolean;
}

export function KpiRow({
	companies,
	activeProjects,
	totalProjects,
	projectValue,
	totalBonds,
	co2Reduction,
	co2Target,
	loading = false,
}: KpiRowProps) {
	const co2Share =
		co2Target > 0 ? Math.round((co2Reduction / co2Target) * 100) : 0;
	// Labels and icons are static, so they stay real text while loading.
	const cards = [
		{
			label: "Total Organizations",
			value: String(companies),
			icon: faBuilding,
			sub: `${companies} registered companies`,
		},
		{
			label: "Active Projects",
			value: String(activeProjects),
			icon: faIndustry,
			sub: `${totalProjects} total`,
		},
		{
			label: "CO₂ Reduction",
			value: `${co2Reduction} tons`,
			icon: faSeedling,
			sub: `${co2Share}% of the ${co2Target} tons projects target`,
		},
		{
			label: "Project Value",
			value: idr.format(projectValue),
			icon: faChartLine,
			sub: `${totalBonds} bonds`,
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
					loading={loading}
				/>
			))}
		</div>
	);
}
