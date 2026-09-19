import { faTasks } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, EmptyState } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useVendorData } from "../lib/use-vendor-data";
import { ActiveProjectCard } from "../organisms/active-project-card";

export function VendorActiveProjectsPage() {
	const { activeProjects } = useVendorData();

	if (activeProjects.length === 0) {
		return (
			<EmptyState
				icon={<FontAwesomeIcon icon={faTasks} />}
				title="No projects in execution"
				description="Projects appear here when a client awards your proposal and the contract enters execution."
				action={
					<Link to="/vendor/opportunities">
						<Button size="sm">Browse Open Tenders</Button>
					</Link>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6">
				{activeProjects.map((proj) => (
					<ActiveProjectCard key={proj.id} project={proj} />
				))}
			</div>
		</div>
	);
}
