import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useVendorData } from "../lib/use-vendor-data";
import { ActiveProjectHero } from "../organisms/active-project-hero";
import { MilestoneTrackerCard } from "../organisms/milestone-tracker-card";
import { MonthlyEnergyReportCard } from "../organisms/monthly-energy-report-card";

export function VendorActiveProjectDetailPage({
	activeProjectId,
}: {
	activeProjectId?: string;
}) {
	const { activeProjects, submitMilestoneEvidence } = useVendorData();

	const project =
		activeProjects.find((p) => p.id === activeProjectId) ?? activeProjects[0];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link to="/vendor/deals">
					<Button variant="ghost" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to My Deals
					</Button>
				</Link>
			</div>

			<ActiveProjectHero project={project} />

			<MilestoneTrackerCard
				projectId={project.id}
				milestones={project.milestones}
				onSubmitEvidence={submitMilestoneEvidence}
			/>

			<MonthlyEnergyReportCard reports={project.monthlyReports} />
		</div>
	);
}
