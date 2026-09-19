import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useVendorData } from "../lib/use-vendor-data";
import { MatchmakingDeepDiveCard } from "../organisms/matchmaking-deep-dive-card";
import { ProjectDetailHero } from "../organisms/project-detail-hero";
import { ProjectProcurementActionCard } from "../organisms/project-procurement-action-card";
import { ProjectRiskCard } from "../organisms/project-risk-card";
import { ProjectScopeCard } from "../organisms/project-scope-card";

export function VendorProjectDetailPage({
	projectId,
}: {
	projectId?: string;
}) {
	const { projects, verification } = useVendorData();
	const isVerified = verification.status === "VERIFIED";

	const project = projects.find((p) => p.id === projectId) ?? projects[0];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link to="/vendor/opportunities">
					<Button variant="ghost" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to Opportunities
					</Button>
				</Link>
			</div>

			<ProjectDetailHero project={project} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<ProjectScopeCard project={project} />
					<ProjectRiskCard />
					<MatchmakingDeepDiveCard matchmaking={project.matchmaking} />
				</div>

				<div className="space-y-6">
					<ProjectProcurementActionCard
						isVerified={isVerified}
						procurementMethod={project.procurementMethod}
					/>
				</div>
			</div>
		</div>
	);
}
