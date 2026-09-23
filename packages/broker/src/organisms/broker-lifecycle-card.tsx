import {
	Badge,
	Button,
	Card,
	CardContent,
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
	/** Where that work happens; a stage with no work left carries none. */
	surface?: { to: StageSurface; label: string };
}

/** The lifecycle as the broker walks it, in order. DECLINED is the exit, not a stage. */
const STAGES: Stage[] = [
	{
		status: "ASSIGNED",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "DOCUMENT_COLLECTION",
		surface: { to: "/broker/document-requests", label: "Document Requests" },
	},
	{
		status: "UNDER_REVIEW",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "READY_FOR_BOND_ISSUANCE",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "BOND_ISSUANCE",
		surface: { to: "/broker/projects", label: "Assigned Projects" },
	},
	{
		status: "MONITORING",
		surface: { to: "/broker/monthly-reports", label: "Monthly Reports" },
	},
	{ status: "COMPLETED" },
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
			</CardHeader>
			<CardContent>
				<ul className="divide-y divide-border">
					{STAGES.map((stage) => {
						const count = counts[stage.status] ?? 0;

						return (
							<li
								key={stage.status}
								className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
							>
								<span className="font-medium text-foreground">
									{workflowLabel(stage.status)}
								</span>
								<div className="flex shrink-0 items-center gap-2">
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
			</CardContent>
		</Card>
	);
}
