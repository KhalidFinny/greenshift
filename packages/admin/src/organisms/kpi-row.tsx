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
			sub: "target 100 tons/year",
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
				/>
			))}
		</div>
	);
}
