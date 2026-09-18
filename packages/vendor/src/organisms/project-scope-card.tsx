import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import type { VendorProjectCardData } from "../lib/types";

interface ProjectScopeCardProps {
	project: VendorProjectCardData;
}

export function ProjectScopeCard({ project }: ProjectScopeCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Project Description & Scope of Work
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p className="leading-relaxed text-muted-foreground">
					{project.description}
				</p>

				<div>
					<h4 className="mb-2 font-semibold text-foreground">
						Key Technical Requirements:
					</h4>
					<ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
						{project.technicalRequirements.map((req, idx) => (
							<li key={idx}>{req}</li>
						))}
					</ul>
				</div>

				<div>
					<h4 className="mb-2 font-semibold text-foreground">
						Expected Deliverables:
					</h4>
					<ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
						{project.deliverables.map((del, idx) => (
							<li key={idx}>{del}</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
