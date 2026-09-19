import {
	faBookmark,
	faClock,
	faHandshake,
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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	ShimmerBlock,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "../lib/format";
import { MATCH_CRITERIA, matchStrength } from "../lib/matchmaking";
import type { MatchmakingBreakdown, VendorProjectCardData } from "../lib/types";

interface VendorProjectCardProps {
	/** Absent while the tender list is still in flight - the card then shimmers. */
	project?: VendorProjectCardData;
	onSave?: (id: string) => void;
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
			<p className="mt-1 text-sm text-muted-foreground">{explanation}</p>
		</div>
	);
}

/** Only rendered when the model has scored the project for this vendor. */
function MatchmakingDialog({
	matchmaking: mm,
}: {
	matchmaking: MatchmakingBreakdown;
}) {
	const strength = matchStrength(mm.overallMatch);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className="gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/70 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
				>
					<FontAwesomeIcon icon={faInfoCircle} className="text-emerald-700" />
					{mm.overallMatch}% Match
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
						Vendor & Project Match Analysis
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="flex items-center justify-between rounded-xl bg-[#00712D] p-4 text-white">
						<div>
							<p className="text-sm text-emerald-200">Overall Match Score</p>
							<h3 className="text-2xl font-bold text-white">
								{mm.overallMatch}% Match Score
							</h3>
						</div>
						<Badge className={`font-semibold ${strength.className}`}>
							{strength.label} · rank {mm.rank}
						</Badge>
					</div>

					<div className="space-y-3">
						{MATCH_CRITERIA.map((criterion, index) => (
							<MatchBreakdownRow
								key={criterion.key}
								label={`${index + 1}. ${criterion.label}`}
								score={mm[criterion.key]}
								explanation={criterion.explanation}
							/>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function getDaysLeft(deadline: string): number {
	const now = new Date();
	const end = new Date(deadline);
	return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(daysLeft: number): string {
	if (daysLeft <= 3) return "text-red-700";
	if (daysLeft <= 7) return "text-amber-700";
	return "text-muted-foreground";
}

export function VendorProjectCard({
	project,
	onSave,
	variant = "default",
}: VendorProjectCardProps) {
	const daysLeft = project ? getDaysLeft(project.tenderDeadlineAt) : 0;
	const urgencyColor = getUrgencyColor(daysLeft);

	return (
		<Card className="group flex flex-col overflow-hidden transition-all hover:shadow-md">
			<CardContent className="flex flex-1 flex-col p-5">
				<div className="mb-4 flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						{project ? (
							<h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
								{project.title}
							</h3>
						) : (
							<ShimmerBlock className="h-5 w-4/5" />
						)}
						{project ? (
							<p className="mt-1 text-sm text-muted-foreground">
								{project.companyName}
							</p>
						) : (
							<ShimmerBlock className="mt-1 h-4 w-1/2" />
						)}
					</div>
					<div className="flex items-center gap-2">
						{project ? (
							<Button
								size="icon"
								variant="ghost"
								className="size-8 opacity-60 transition-opacity group-hover:opacity-100"
								onClick={() => onSave?.(project.id)}
							>
								<FontAwesomeIcon
									icon={faBookmark}
									className={
										project.isSaved
											? "text-emerald-700"
											: "text-muted-foreground"
									}
								/>
							</Button>
						) : (
							<ShimmerBlock className="size-8 shrink-0 rounded-md" />
						)}
						{project ? (
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50">
								<span className="text-sm font-bold text-emerald-700">
									{project.matchmaking
										? `${project.matchmaking.overallMatch}%`
										: "n/a"}
								</span>
							</div>
						) : (
							<ShimmerBlock className="size-12 shrink-0 rounded-full" />
						)}
					</div>
				</div>

				<div className="mb-4">
					{!project ? (
						<ShimmerBlock className="h-5 w-24 rounded-md" />
					) : project.procurementMethod === "DIRECT_SELECTION" ? (
						<Badge className="bg-purple-600 text-white">
							<FontAwesomeIcon icon={faHandshake} className="mr-1 text-sm" />
							Invitation Only
						</Badge>
					) : project.procurementMethod === "OPEN_BIDDING" ? (
						<Badge
							variant="outline"
							className="border-emerald-600/30 bg-emerald-50 text-emerald-800"
						>
							Open Bidding
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="border-blue-600/30 bg-blue-50 text-blue-800"
						>
							Closed Bidding
						</Badge>
					)}
					{variant === "recommended" && project && (
						<Badge className="ml-1.5 bg-emerald-700 text-white">Top Pick</Badge>
					)}
				</div>

				<div className="mb-4 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Budget</span>
						{project ? (
							<span className="text-sm font-bold text-foreground">
								{formatRupiah(project.estimatedValue)}
							</span>
						) : (
							<ShimmerBlock className="h-4 w-28" />
						)}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Carbon Target</span>
						{project ? (
							<span className="text-sm font-bold text-emerald-700">
								{project.carbonReductionTargetTons === null
									? "Not set"
									: `${project.carbonReductionTargetTons} tCO₂e/yr`}
							</span>
						) : (
							<ShimmerBlock className="h-4 w-24" />
						)}
					</div>
				</div>

				<div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
					{project ? (
						<span className="flex items-center gap-1.5">
							<FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
							{project.location}
						</span>
					) : (
						<ShimmerBlock className="h-4 w-24" />
					)}
					{project ? (
						<span
							className={`flex items-center gap-1 font-medium ${urgencyColor}`}
						>
							<FontAwesomeIcon icon={faClock} className="text-sm" />
							{daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
						</span>
					) : (
						<ShimmerBlock className="h-4 w-16" />
					)}
				</div>

				<div className="mt-auto" />

				<div className="flex items-center gap-2 border-t border-border pt-4">
					{project ? (
						<>
							{project.matchmaking ? (
								<MatchmakingDialog matchmaking={project.matchmaking} />
							) : null}
							<Link
								to="/vendor/projects/$id"
								params={{ id: project.id }}
								className="flex-1"
							>
								<Button className="w-full bg-[#00712D] text-white hover:bg-[#00712D]/90">
									View Details
								</Button>
							</Link>
						</>
					) : (
						<>
							<ShimmerBlock className="h-8 w-28 shrink-0 rounded-md" />
							<ShimmerBlock className="h-8 flex-1 rounded-md" />
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
