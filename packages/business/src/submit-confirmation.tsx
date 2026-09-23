/* Where the wizard hands over: the project is submitted, and this says so and says
 * what happens next. The record is `ProjectRecord`, as on the project's own page. */

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiError, api } from "@greenshift/core";
import { Button, cn, EmptyState, ShimmerBlock } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatSubmittedAt, STATUS_PILL } from "./lib/project-display";
import { isMatchmakingOpen, ProjectRecord } from "./project-record";

export function SubmitConfirmation({ projectId }: { projectId: string }) {
	const id = Number(projectId);
	const projectQuery = useQuery({
		queryKey: ["business", "project", id],
		enabled: Number.isSafeInteger(id),
		queryFn: async () => (await api.business.project(id)).project,
		staleTime: 60 * 1000,
	});

	if (projectQuery.isError) {
		const error = projectQuery.error;
		return (
			<div className="py-20">
				<EmptyState
					tone="error"
					title="This project did not load"
					description={
						error instanceof ApiError && error.status === 404
							? "It is not on your company's record."
							: "Could not reach the projects endpoint."
					}
					action={
						<Button variant="outline" onClick={() => projectQuery.refetch()}>
							Try again
						</Button>
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

	// The same width as the project's own page: the same record, at handover.
	return (
		<div className="space-y-8">
			<div className="rounded-xl border border-border bg-muted/50 px-6 py-6">
				<p className="flex items-center gap-2 text-sm font-medium text-primary">
					<FontAwesomeIcon icon={faCircleCheck} aria-hidden />
					Submission received
				</p>
				<h1 className="mt-2 text-2xl font-semibold">{project.title}</h1>
				<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
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

				{/* Where to go next, above the record, so the next actions are not buried
				    under the summary. Every one is a button: a text-only action would read as a note. */}
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<Button asChild>
						<Link to="/business/projects">View my projects</Link>
					</Button>
					{/* Matchmaking opens with verification, so the route is offered once it clears. */}
					{isMatchmakingOpen(project.status) ? (
						<Button variant="secondary" asChild>
							<Link to="/business/matchmaking">Go to vendor matchmaking</Link>
						</Button>
					) : null}
					<Button variant="outline" asChild>
						<Link to="/business/submit">Submit another project</Link>
					</Button>
				</div>
			</div>

			<ProjectRecord projectId={projectId} />
		</div>
	);
}
