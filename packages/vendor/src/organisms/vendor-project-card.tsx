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
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
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

/** A row rather than a boxed card: five boxed cards made this dialog a column. */
function MatchBreakdownRow({
	label,
	score,
	explanation,
}: {
	label: string;
	score: number;
	explanation: string;
}) {
	// The model stores criteria unrounded because the total is what it rounds; a score shows as a whole percentage.
	const pct = Math.round(score);
	return (
		<div className="space-y-1.5">
			<div className="flex items-baseline justify-between gap-3">
				<span className="text-sm font-semibold">{label}</span>
				<span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
					{pct}%
				</span>
			</div>
			<div className="h-1.5 rounded-full bg-muted">
				<div
					className="h-1.5 rounded-full bg-emerald-700"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="text-sm text-muted-foreground">{explanation}</p>
		</div>
	);
}

function MatchmakingDialog({
	matchmaking: mm,
	projectTitle,
}: {
	matchmaking: MatchmakingBreakdown;
	projectTitle: string;
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
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
						Vendor &amp; Project Match Analysis
					</DialogTitle>
					<DialogDescription className="text-base">
						{projectTitle}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6 pt-2 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
					<div className="flex flex-col justify-center gap-6 rounded-xl bg-[#03442C] p-4 text-white">
						<div>
							<p className="text-sm text-emerald-200">Overall match</p>
							<p className="mt-1 text-4xl font-bold tabular-nums">
								{mm.overallMatch}%
							</p>
						</div>
						<div className="space-y-2">
							<Badge className={cn("font-semibold", strength.className)}>
								{strength.label}
							</Badge>
							<p className="text-sm text-emerald-100/80">
								Rank {mm.rank} among the vendors scored for this project.
							</p>
						</div>
					</div>

					<div className="space-y-4">
						{MATCH_CRITERIA.map((criterion) => (
							<MatchBreakdownRow
								key={criterion.key}
								label={criterion.label}
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
								<MatchmakingDialog
									matchmaking={project.matchmaking}
									projectTitle={project.title}
								/>
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
