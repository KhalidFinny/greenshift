import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ShimmerBlock,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { workflowLabel } from "../lib/lifecycle";
import type { BrokerAssignedProject } from "../lib/types";

/** Destinations a stage's work lands on. Typed so a typo cannot ship. */
type StageSurface =
	| "/broker/projects"
	| "/broker/document-requests"
	| "/broker/monthly-reports";

interface Stage {
	status: BrokerAssignedProject["workflowStatus"];
	/** What the broker does here, in one line. */
	action: string;
	/** Where that work happens; a stage with no work left carries none. */
	surface?: { to: StageSurface; label: string };
}

/** The lifecycle as the broker walks it, in order. DECLINED is the exit, not a stage. */
const STAGES: Stage[] = [
	{
		status: "ASSIGNED",
		action:
			"The company assigns a project GreenShift has already verified. You accept it, ask the company for information, or decline with a reason.",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "DOCUMENT_COLLECTION",
		action:
			"You request documents — category, period, reason and deadline — and the company uploads them.",
		surface: { to: "/broker/document-requests", label: "Document Requests" },
	},
	{
		status: "UNDER_REVIEW",
		action:
			"You work the file: the risk assessment and the financial projections are read-only, so the appraisal follows what GreenShift verified.",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "READY_FOR_BOND_ISSUANCE",
		action: "The file is complete and the project can be taken to issuance.",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "BOND_ISSUANCE",
		action:
			"You record the issuance that happened in the partner app: status, serial number, amount, coupon, tenor and dates.",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "MONITORING",
		action:
			"You read the official monthly reports: progress from milestones, energy and carbon from the MRV periods.",
		surface: { to: "/broker/monthly-reports", label: "Monthly Reports" },
	},
	{
		status: "COMPLETED",
		action:
			"The project is finished. Nothing is left to record, and the closed file stays readable.",
	},
];

interface BrokerLifecycleCardProps {
	/** This broker's assignments; the counts are read off their workflow stage. */
	projects: BrokerAssignedProject[];
	/** Data still in flight: the stage list is static, so only the counts shimmer. */
	loading?: boolean;
}

export function BrokerLifecycleCard({
	projects,
	loading = false,
}: BrokerLifecycleCardProps) {
	const counts: Record<string, number> = {};
	for (const project of projects) {
		counts[project.workflowStatus] = (counts[project.workflowStatus] ?? 0) + 1;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Broker lifecycle</CardTitle>
				<CardDescription className="text-sm">
					Every stage a project passes through, what you do at each, and where
					on the platform that work happens. The number beside a stage is how
					many of your projects sit there.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="divide-y divide-border">
					{STAGES.map((stage) => {
						const count = counts[stage.status] ?? 0;

						return (
							<li
								key={stage.status}
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
							>
								<div className="min-w-0 space-y-1">
									<p className="font-semibold text-foreground">
										{workflowLabel(stage.status)}
									</p>
									<p className="text-sm text-muted-foreground">
										{stage.action}
									</p>
								</div>
								<div className="flex shrink-0 flex-wrap items-center gap-2">
									{loading ? (
										<ShimmerBlock className="h-7 w-10" />
									) : count > 0 ? (
										<Badge variant="outline">{count}</Badge>
									) : (
										<span className="text-sm text-muted-foreground">
											Nothing here
										</span>
									)}
									{stage.surface ? (
										<Button variant="outline" size="sm" asChild>
											<Link to={stage.surface.to}>{stage.surface.label}</Link>
										</Button>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
				<p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
					Declining is the exit, not a stage: the company is notified and places
					the project with another broker.
				</p>
			</CardContent>
		</Card>
	);
}
