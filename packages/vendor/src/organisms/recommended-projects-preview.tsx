import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "../lib/format";
import type { VendorProjectCardData } from "../lib/types";

interface RecommendedProjectsPreviewProps {
	projects: VendorProjectCardData[];
}

export function RecommendedProjectsPreview({
	projects,
}: RecommendedProjectsPreviewProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Recommended</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{projects.slice(0, 2).map((proj) => (
					<div
						key={proj.id}
						className="space-y-3 rounded-xl border border-border p-4"
					>
						<div className="flex items-center justify-between">
							<Badge className="bg-emerald-700 text-white">
								Match Score {proj.matchmaking.overallMatch}%
							</Badge>
							<span className="text-xs font-semibold text-muted-foreground">
								{proj.location}
							</span>
						</div>
						<h4 className="line-clamp-2 text-sm font-semibold">{proj.title}</h4>
						<p className="text-xs text-muted-foreground">
							{formatRupiah(proj.estimatedValue)} • Carbon Target{" "}
							{proj.carbonReductionTargetTons} tCO₂e/yr
						</p>
						<div className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
							💡 {proj.matchmaking.technicalFitExplanation}
						</div>
						<Link to="/vendor/opportunities" className="block pt-1">
							<Button
								size="sm"
								variant="ghost"
								className="w-full text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
							>
								View Project Details →
							</Button>
						</Link>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
