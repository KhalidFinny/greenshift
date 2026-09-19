import {
	faCheckCircle,
	faClock,
	faTasks,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatRupiah, formatShortDate } from "../lib/format";
import { MILESTONE_STATUS_LABEL } from "../lib/labels";
import type { ActiveVendorProject } from "../lib/types";

interface ActiveProjectCardProps {
	project: ActiveVendorProject;
	onSelect?: () => void;
}

export function ActiveProjectCard({
	project,
	onSelect,
}: ActiveProjectCardProps) {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 pb-4">
				<div>
					<div className="flex items-center gap-2">
						<Badge className="bg-[#00712D] text-white">
							Progress {project.overallProgressPercent}%
						</Badge>
						<Badge variant="outline" className="text-sm">
							{project.status.replace("_", " ")}
						</Badge>
					</div>
					<CardTitle className="mt-2 text-lg">{project.title}</CardTitle>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Client: {project.companyName} • {project.location}
					</p>
				</div>
				{onSelect ? (
					<Button
						onClick={onSelect}
						className="gap-2 bg-[#00712D] text-white hover:bg-[#00712D]/90"
					>
						<FontAwesomeIcon icon={faTasks} />
						Manage Project Milestones
					</Button>
				) : (
					<Link to="/vendor/active-projects/$id" params={{ id: project.id }}>
						<Button className="gap-2 bg-[#00712D] text-white hover:bg-[#00712D]/90">
							<FontAwesomeIcon icon={faTasks} />
							Manage Project Milestones
						</Button>
					</Link>
				)}
			</CardHeader>

			<CardContent className="space-y-6 p-6 text-sm">
				{/* Progress Bar */}
				<div className="space-y-1.5">
					<div className="flex justify-between font-semibold text-foreground">
						<span>Overall Execution Progress</span>
						<span>{project.overallProgressPercent}% Completed</span>
					</div>
					<div className="h-3 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-[#00712D] transition-all"
							style={{ width: `${project.overallProgressPercent}%` }}
						/>
					</div>
				</div>

				{/* Milestones Horizontal Progress Overview */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{project.milestones.map((ms) => {
						const isDone =
							ms.status === "COMPLETED" || ms.status === "APPROVED";
						const isInProg =
							ms.status === "IN_PROGRESS" ||
							ms.status === "SUBMITTED_FOR_REVIEW";
						return (
							<div
								key={ms.id}
								className={`space-y-1 rounded-lg border p-3 ${
									isDone
										? "border-emerald-500 bg-emerald-50/50"
										: isInProg
											? "border-blue-500 bg-blue-50/50 font-medium"
											: "border-border bg-card"
								}`}
							>
								<div className="flex items-center justify-between text-sm">
									<span className="font-bold">Step 0{ms.stepNumber}</span>
									{isDone ? (
										<FontAwesomeIcon
											icon={faCheckCircle}
											className="text-emerald-700"
										/>
									) : isInProg ? (
										<FontAwesomeIcon icon={faClock} className="text-blue-600" />
									) : null}
								</div>
								<p className="line-clamp-1 font-semibold text-foreground">
									{ms.title}
								</p>
								<p className="text-sm text-muted-foreground">
									Status: {MILESTONE_STATUS_LABEL[ms.status]}
								</p>
							</div>
						);
					})}
				</div>

				{/* Impact Metrics Summary */}
				<div className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 sm:grid-cols-4">
					<div>
						<p className="text-muted-foreground">Contracted Value</p>
						<p className="mt-0.5 text-sm font-bold text-foreground">
							{formatRupiah(project.agreedBudget)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Target Handover (BAST)</p>
						<p className="mt-0.5 text-sm font-bold text-foreground">
							{formatShortDate(project.deadlineDate)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Actual Energy Savings</p>
						<p className="mt-0.5 text-sm font-bold text-emerald-700">
							{project.actualEnergySavingsPercent ??
								project.expectedEnergySavingsPercent}
							% / yr
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Actual Carbon Reduction</p>
						<p className="mt-0.5 text-sm font-bold text-emerald-700">
							{project.actualCarbonReductionTons ??
								project.expectedCarbonReductionTons}{" "}
							tCO₂e/yr
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
