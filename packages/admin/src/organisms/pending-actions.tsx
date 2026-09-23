import {
	faCircleExclamation,
	faCircleInfo,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AdminAnomaly } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

/** The anomaly engine reports severity; the console shows it as-is. */
const SEVERITY_STYLE: Record<
	AdminAnomaly["severity"],
	{
		icon: typeof faCircleInfo;
		className: string;
		variant: "destructive" | "secondary" | "outline";
	}
> = {
	critical: {
		icon: faTriangleExclamation,
		className: "text-destructive",
		variant: "destructive",
	},
	high: {
		icon: faTriangleExclamation,
		className: "text-destructive",
		variant: "destructive",
	},
	medium: {
		icon: faCircleExclamation,
		className: "text-muted-foreground",
		variant: "secondary",
	},
	low: {
		icon: faCircleInfo,
		className: "text-muted-foreground",
		variant: "outline",
	},
};

interface PendingActionsCardProps {
	/** Rule breaches reported by the anomaly engine, most severe first. */
	actions: AdminAnomaly[];
	/** Data still in flight: same card, shimmering rows. */
	loading?: boolean;
}

/** Open issues the platform is watching, straight from the anomaly engine. */
export function PendingActionsCard({
	actions,
	loading = false,
}: PendingActionsCardProps) {
	// The audit log is the way out of this card in every state, so exactly one control points at it.
	const hasActions = actions.length > 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Pending Actions</CardTitle>
					{loading || hasActions ? (
						<Button asChild variant="outline" className="">
							<Link to="/admin/audit-logs">View audit log</Link>
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				{loading ? (
					<ul className="space-y-3">
						{Array.from({ length: 3 }, (_, index) => (
							<li
								key={index}
								className="flex items-start gap-4 rounded-xl border border-border/70 bg-muted/10 p-4"
							>
								<ShimmerBlock className="size-10 shrink-0 rounded-full" />
								<div className="min-w-0 flex-1 space-y-2">
									<ShimmerBlock className="h-5 w-48" />
									<ShimmerBlock className="h-5 w-full" />
								</div>
								<ShimmerBlock className="h-8 w-20 shrink-0 rounded-md" />
							</li>
						))}
					</ul>
				) : actions.length === 0 ? (
					<EmptyState
						title="No rule breaches open"
						description="The anomaly engine watches project milestones, blueprint audits, and vendor verification. Nothing is breached right now, so there is nothing to action here."
						action={
							<Button asChild variant="outline">
								<Link to="/admin/audit-logs">Review the audit log</Link>
							</Button>
						}
					/>
				) : (
					<ul className="space-y-3">
						{actions.slice(0, 6).map((action, index) => {
							const style = SEVERITY_STYLE[action.severity];
							return (
								<li
									key={action.id ?? `${action.code}-${index}`}
									className="flex items-start gap-4 rounded-xl border border-border/70 bg-muted/10 p-4"
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
										<FontAwesomeIcon
											icon={style.icon}
											className={style.className}
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-base font-medium">{action.title}</p>
										<p className="mt-1 text-base text-muted-foreground">
											{action.description}
										</p>
									</div>
									<Badge
										variant={style.variant}
										className="!h-8 rounded-md px-3 text-base"
									>
										{action.severity}
									</Badge>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
