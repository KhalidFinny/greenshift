import {
	faBookmark,
	faInfoCircle,
	faLeaf,
	faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { VendorProjectCardData } from "../lib/types";
import { formatRupiah } from "../lib/format";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";

interface VendorProjectCardProps {
	project: VendorProjectCardData;
	onSave: (id: string) => void;
	/** Highlight variant for recommended tab */
	variant?: "default" | "recommended";
}

function MatchBreakdownRow({
	label,
	score,
	explanation,
}: {
	label: string;
	score: number;
	explanation: string;
}) {
	return (
		<div className="rounded-lg border border-border p-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold">{label}</span>
				<Badge variant="secondary">{score}%</Badge>
			</div>
			<p className="mt-1 text-xs text-muted-foreground">{explanation}</p>
		</div>
	);
}

function MatchmakingDialog({ project }: { project: VendorProjectCardData }) {
	const mm = project.matchmaking;
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className="h-8 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/70 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
				>
					<FontAwesomeIcon icon={faInfoCircle} className="text-emerald-600 dark:text-emerald-400" />
					{mm.overallMatch}% Match
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
						Vendor & Project Match Analysis
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="flex items-center justify-between rounded-xl bg-[#03442C] p-4 text-white">
						<div>
							<p className="text-xs text-emerald-200">Overall Match Score</p>
							<h3 className="text-2xl font-bold text-white">
								{mm.overallMatch}% Match Score
							</h3>
						</div>
						<Badge className="bg-emerald-500 font-semibold text-white">
							Highly Recommended
						</Badge>
					</div>

					<div className="space-y-3">
						<MatchBreakdownRow
							label="1. Technical Fit"
							score={mm.technicalFit}
							explanation={mm.technicalFitExplanation}
						/>
						<MatchBreakdownRow
							label="2. Relevant Experience"
							score={mm.relevantExperience}
							explanation={mm.relevantExperienceExplanation}
						/>
						<MatchBreakdownRow
							label="3. Historical Performance"
							score={mm.historicalPerformance}
							explanation={mm.historicalPerformanceExplanation}
						/>
						<MatchBreakdownRow
							label="4. Price & Value"
							score={mm.priceAndValue}
							explanation={mm.priceAndValueExplanation}
						/>
						<MatchBreakdownRow
							label="5. Project Risk"
							score={mm.projectRisk}
							explanation={mm.projectRiskExplanation}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function VendorProjectCard({
	project,
	onSave,
	variant = "default",
}: VendorProjectCardProps) {
	return (
		<Card className="flex flex-col justify-between transition-all hover:border-emerald-500/50">
			<CardHeader className="space-y-3 pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-wrap items-center gap-1.5">
						{project.procurementMethod === "DIRECT_SELECTION" ? (
							<Badge className="gap-1 bg-purple-600 text-[11px] font-bold text-white">
								<FontAwesomeIcon icon={faHandshake} className="text-[10px]" />
								Direct Invitation
							</Badge>
						) : project.procurementMethod === "OPEN_BIDDING" ? (
							<Badge
								variant="outline"
								className="border-emerald-600/30 bg-emerald-50 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
							>
								Open Bidding
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="border-blue-600/30 bg-blue-50 text-[11px] font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
							>
								Closed Bidding
							</Badge>
						)}
						{variant === "recommended" && (
							<Badge className="bg-emerald-600 text-[11px] font-bold text-white">
								★ Recommended
							</Badge>
						)}
					</div>
					<Button
						size="icon"
						variant="ghost"
						className="size-8"
						onClick={() => onSave(project.id)}
					>
						<FontAwesomeIcon
							icon={faBookmark}
							className={
								project.isSaved ? "text-emerald-600" : "text-muted-foreground"
							}
						/>
					</Button>
				</div>
				<CardTitle className="line-clamp-2 text-base">{project.title}</CardTitle>
				<p className="text-xs font-medium text-muted-foreground">
					{project.companyName} • {project.industrySector}
				</p>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				{variant === "recommended" && (
					<p className="line-clamp-2 text-muted-foreground">
						{project.description}
					</p>
				)}

				<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5">
					<div>
						<p className="text-muted-foreground">Estimated Budget</p>
						<p className="mt-0.5 font-semibold text-foreground">
							{formatRupiah(project.estimatedValue)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Carbon Target</p>
						<p className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
							{project.carbonReductionTargetTons} tCO₂e/yr
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
						{project.location}
					</span>
					<span className="text-[11px]">
						Ends{" "}
						{new Date(project.tenderDeadlineAt).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
						})}
					</span>
				</div>

				<div className="flex items-center justify-between gap-2 border-t border-border pt-2">
					<MatchmakingDialog project={project} />
					<Link to="/vendor/projects/$id" params={{ id: project.id }}>
						<Button size="sm" className="bg-[#03442C] text-white hover:bg-[#03442C]/90">
							View Project
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
