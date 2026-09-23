import { ApiError, api } from "@greenshift/core";
import { Button, cn, EmptyState, ShimmerBlock } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatId } from "../lib/number-format";
import {
	formatRupiah,
	formatSubmittedAt,
	STATUS_PILL,
} from "../lib/project-display";
import { ChooseBrokerCard } from "../organisms/choose-broker-card";
import { isMatchmakingOpen, ProjectRecord } from "./project-record";

export function ProjectDetail({ projectId }: { projectId: string }) {
	const id = Number(projectId);

	const projectQuery = useQuery({
		queryKey: ["business", "project", id],
		enabled: Number.isSafeInteger(id),
		queryFn: async () => (await api.business.project(id)).project,
		staleTime: 60 * 1000,
	});

	if (projectQuery.isError) {
		// Missing project vs failed request: the first is the route's own answer, the second retryable.
		const missing =
			projectQuery.error instanceof ApiError &&
			projectQuery.error.status === 404;
		return (
			<div className="py-20">
				<EmptyState
					tone={missing ? "neutral" : "error"}
					title={missing ? "Project not found" : "This project did not load"}
					description={
						missing
							? "It is not one of your company's projects."
							: "The projects endpoint could not be reached."
					}
					action={
						missing ? (
							<Button asChild>
								<Link to="/business/projects">Back to my projects</Link>
							</Button>
						) : (
							<Button variant="outline" onClick={() => projectQuery.refetch()}>
								Try again
							</Button>
						)
					}
				/>
			</div>
		);
	}

	const project = projectQuery.data;
	if (!project) {
		return (
			<div className="space-y-6" aria-busy>
				<ShimmerBlock className="h-28 w-full rounded-xl" />
				<ShimmerBlock className="h-40 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
				<div className="min-w-0">
					<h1 className="text-xl font-semibold">{project.title}</h1>
					<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
						<span
							className={cn(
								"rounded-md px-2.5 py-1 text-sm font-medium",
								STATUS_PILL[project.statusLabel] ??
									"bg-muted text-muted-foreground",
							)}
						>
							{project.statusLabel}
						</span>
						<p className="text-sm tabular-nums text-muted-foreground">
							Reference #{project.id}
							{project.submittedAt
								? ` · submitted ${formatSubmittedAt(project.submittedAt)}`
								: ""}
						</p>
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
						<span>
							{project.location ?? "Location not filled in"}
							{project.sector ? ` · ${project.sector}` : ""}
						</span>
						<span className="tabular-nums">
							CAPEX {formatRupiah(project.funding.capexRp)}
						</span>
						<span className="tabular-nums">
							Baseline{" "}
							{project.baselineTco2 === null
								? "not filled in"
								: `${formatId(project.baselineTco2, 1)} tCO₂/yr`}
						</span>
						{project.creditRating === null ? null : (
							<span className="tabular-nums">
								Credit {project.creditRating}
								{project.creditScore === null
									? ""
									: ` · ${project.creditScore} of 100`}
							</span>
						)}
					</div>
				</div>
				<Button variant="outline" asChild>
					<Link to="/business/projects">Back to my projects</Link>
				</Button>
			</div>

			<ProjectRecord projectId={projectId} />

			<ChooseBrokerCard projectId={id} />

			{/* Matchmaking opens with verification, so the route is offered once it clears. */}
			{isMatchmakingOpen(project.status) ? (
				<div className="flex flex-wrap items-center gap-3">
					<Button variant="outline" asChild>
						<Link to="/business/matchmaking">Go to vendor matchmaking</Link>
					</Button>
				</div>
			) : null}
		</div>
	);
}
