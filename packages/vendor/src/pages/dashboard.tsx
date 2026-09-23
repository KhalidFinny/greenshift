import {
	faAward,
	faFileSignature,
	faHandshake,
	faProjectDiagram,
} from "@fortawesome/free-solid-svg-icons";
import { EmptyState } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { VendorKpiRow } from "../molecules/vendor-kpi-row";
import { VerificationBanner } from "../molecules/verification-banner";
import { ActionRequiredCard } from "../organisms/action-required-card";
import { RecommendedProjectsPreview } from "../organisms/recommended-projects-preview";

export function VendorDashboard() {
	const {
		isLoading,
		verification,
		projects,
		proposals,
		negotiations,
		activeProjects,
		portfolio,
		leaderboard,
	} = useVendorData();

	if (!isLoading && projects.length === 0 && negotiations.length === 0) {
		return (
			<EmptyState
				title="No activity yet"
				description="Open tenders and client requests will appear here once your profile is verified."
			/>
		);
	}

	const kpiItems = [
		{
			label: "Active Tenders",
			value: projects.filter((p) => p.procurementMethod === "OPEN_BIDDING")
				.length,
			sub: "Open for participation",
			icon: faHandshake,
			iconBg: "bg-emerald-100",
			iconColor: "text-emerald-700",
		},
		{
			label: "Proposals Submitted",
			value: proposals.length,
			sub: "Under client evaluation",
			icon: faFileSignature,
			iconBg: "bg-blue-100",
			iconColor: "text-blue-700",
		},
		{
			label: "Projects in Execution",
			value: activeProjects.length,
			sub: "Active milestone delivery",
			icon: faProjectDiagram,
			iconBg: "bg-amber-100",
			iconColor: "text-amber-700",
		},
		{
			label: "Verified Portfolio",
			value: portfolio.length,
			sub: "Verified completed track record",
			icon: faAward,
			iconBg: "bg-purple-100",
			iconColor: "text-purple-700",
		},
	];

	return (
		<div className="space-y-6">
			<VerificationBanner status={verification.status} />

			<VendorKpiRow items={kpiItems} loading={isLoading} />

			<RecommendedProjectsPreview projects={projects} loading={isLoading} />

			<ActionRequiredCard
				negotiations={negotiations}
				projects={projects}
				leaderboard={leaderboard}
				loading={isLoading}
			/>
		</div>
	);
}
