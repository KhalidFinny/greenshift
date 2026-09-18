import {
	faAward,
	faFileSignature,
	faHandshake,
	faProjectDiagram,
} from "@fortawesome/free-solid-svg-icons";
import { useVendorData } from "../lib/use-vendor-data";
import { ActionRequiredCard } from "../organisms/action-required-card";
import { RecommendedProjectsPreview } from "../organisms/recommended-projects-preview";
import { VendorKpiRow } from "../organisms/vendor-kpi-row";
import { VerificationBanner } from "../organisms/verification-banner";

export function VendorDashboard() {
	const {
		verification,
		projects,
		proposals,
		negotiations,
		activeProjects,
		portfolio,
		leaderboard,
	} = useVendorData();

	const kpiItems = [
		{
			label: "Active Tenders",
			value: projects.filter((p) => p.procurementMethod === "OPEN_BIDDING")
				.length,
			sub: "Open for participation",
			icon: faHandshake,
			iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
			iconColor: "text-emerald-700 dark:text-emerald-300",
		},
		{
			label: "Proposals Submitted",
			value: proposals.length,
			sub: "Under client evaluation",
			icon: faFileSignature,
			iconBg: "bg-blue-100 dark:bg-blue-950/60",
			iconColor: "text-blue-700 dark:text-blue-300",
		},
		{
			label: "Projects in Execution",
			value: activeProjects.length,
			sub: "Active milestone delivery",
			icon: faProjectDiagram,
			iconBg: "bg-amber-100 dark:bg-amber-950/60",
			iconColor: "text-amber-700 dark:text-amber-300",
		},
		{
			label: "Verified Portfolio",
			value: portfolio.length,
			sub: "Verified completed track record",
			icon: faAward,
			iconBg: "bg-purple-100 dark:bg-purple-950/60",
			iconColor: "text-purple-700 dark:text-purple-300",
		},
	];

	return (
		<div className="space-y-6">
			<VerificationBanner status={verification.status} />

			<VendorKpiRow items={kpiItems} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<ActionRequiredCard
						negotiations={negotiations}
						projects={projects}
						leaderboard={leaderboard}
					/>
				</div>
				<RecommendedProjectsPreview projects={projects} />
			</div>
		</div>
	);
}
