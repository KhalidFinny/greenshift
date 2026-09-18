import { Badge, Card, CardContent } from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { ActiveVendorProject } from "../lib/types";

interface ActiveProjectHeroProps {
	project: ActiveVendorProject;
}

export function ActiveProjectHero({ project }: ActiveProjectHeroProps) {
	return (
		<Card className="border-0 bg-[#03442C] text-white">
			<CardContent className="space-y-4 p-6">
				<div className="flex items-center justify-between">
					<Badge className="bg-emerald-500 font-bold text-white">
						Project Progress {project.overallProgressPercent}%
					</Badge>
					<span className="text-xs text-emerald-200">
						Target Completion: {project.deadlineDate}
					</span>
				</div>

				<h1 className="text-2xl font-bold text-white">{project.title}</h1>
				<p className="text-xs text-emerald-100">
					Client: {project.companyName} • Contracted Value:{" "}
					{formatRupiah(project.agreedBudget)}
				</p>

				<div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
					<div
						className="h-full bg-emerald-400"
						style={{ width: `${project.overallProgressPercent}%` }}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
