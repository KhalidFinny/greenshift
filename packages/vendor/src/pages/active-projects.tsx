import { useVendorData } from "../lib/use-vendor-data";
import { ActiveProjectCard } from "../organisms/active-project-card";

export function VendorActiveProjectsPage() {
	const { activeProjects } = useVendorData();

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
