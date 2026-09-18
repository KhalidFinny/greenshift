import { faBuilding, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Card, CardContent } from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import { PROCUREMENT_METHOD_LABEL } from "../lib/labels";
import type { VendorProjectCardData } from "../lib/types";

interface ProjectDetailHeroProps {
	project: VendorProjectCardData;
}

export function ProjectDetailHero({ project }: ProjectDetailHeroProps) {
	const mm = project.matchmaking;

	return (
		<Card className="border-0 bg-[#03442C] text-white">
			<CardContent className="space-y-4 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Badge className="bg-emerald-500 font-bold text-white">
							Match Score {mm.overallMatch}%
						</Badge>
						<Badge
							variant="outline"
							className="border-white/30 text-xs uppercase text-white"
						>
							{PROCUREMENT_METHOD_LABEL[project.procurementMethod]}
						</Badge>
					</div>
					<span className="text-xs text-emerald-200">
						Tender Deadline:{" "}
						{new Date(project.tenderDeadlineAt).toLocaleDateString("en-US", {
							dateStyle: "medium",
						})}
					</span>
				</div>

				<div>
					<h1 className="text-2xl font-bold text-white">{project.title}</h1>
					<p className="mt-1 flex items-center gap-3 text-sm text-emerald-100/90">
						<span className="flex items-center gap-1">
							<FontAwesomeIcon icon={faBuilding} /> {project.companyName}
						</span>
						•
						<span className="flex items-center gap-1">
							<FontAwesomeIcon icon={faMapMarkerAlt} /> {project.location}
						</span>
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-xl bg-white/10 p-4 text-xs sm:grid-cols-4">
					<div>
						<p className="text-emerald-200">Client Budget</p>
						<p className="mt-1 text-sm font-bold text-white">
							{formatRupiah(project.clientBudget)}
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Estimated Project Value</p>
						<p className="mt-1 text-sm font-bold text-white">
							{formatRupiah(project.estimatedValue)}
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Carbon Abatement Target</p>
						<p className="mt-1 text-sm font-bold text-emerald-300">
							{project.carbonReductionTargetTons} tCO₂e/yr
						</p>
					</div>
					<div>
						<p className="text-emerald-200">Project Risk Rating</p>
						<p className="mt-1 text-sm font-bold text-white">
							{project.riskScore}/100 (Medium)
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
