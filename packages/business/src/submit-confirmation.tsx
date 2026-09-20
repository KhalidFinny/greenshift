/* Where the wizard hands over: the project is submitted, and this says so and
 * says what happens next.
 *
 * It reads the project back from the API rather than trusting what the form
 * held, so the figures here are the stored ones and a reload of this page shows
 * the same record rather than a session's memory of it.
 */

import {
	faArrowRight,
	faCircleCheck,
	faClock,
	faHandshake,
	faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiError, api } from "@greenshift/core";
import {
	Button,
	Card,
	CardContent,
	cn,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatId } from "./lib/number-format";
import { formatSubmittedAt, STATUS_PILL } from "./lib/project-display";

/** The two stages the project passes through after submit, in order. */
const STAGES = [
	{
		icon: faShieldHalved,
		title: "LVV verification",
		body: "The file goes to a greenhouse gas Validation and Verification Body, which checks the figures and the documents behind them. Its verdict arrives in your notifications, on the project's own record.",
	},
	{
		icon: faHandshake,
		title: "Vendor matchmaking",
		body: "A verified project goes on to matchmaking, where you choose the vendor that carries it out.",
	},
] as const;

/**
 * How far along that path each stored status is: the number of stages already
 * behind the project. Keyed by the enum rather than its pill label, because the
 * label is presentation copy and the enum is what the row actually holds. A
 * status the schema does not define cannot reach here; if one did, it would read
 * as freshly submitted, which is the safe direction to be wrong in.
 */
const STAGES_PASSED: Record<string, number> = {
	draft: 0,
	assessment: 0,
	tendering: 1,
	funding: 1,
	blueprint: 2,
	monitoring: 2,
	completed: 2,
};

/** Where one stage stands for a project at that point. */
function stageState(
	index: number,
	status: string,
): "done" | "in progress" | "waiting" {
	const passed = STAGES_PASSED[status] ?? 0;
	if (index < passed) return "done";
	return index === passed ? "in progress" : "waiting";
}

/** One figure of the submission, label above value. */
function Figure({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="min-w-0">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="mt-1.5 text-lg font-semibold tabular-nums">{value}</p>
			{hint ? (
				<p className="mt-1 text-sm text-muted-foreground">{hint}</p>
			) : null}
		</div>
	);
}

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

	return (
		<div className="max-w-3xl space-y-8">
			{/* The one thing this page has to say, said first. */}
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
			</div>

			<Card>
				<CardContent className="grid gap-6 sm:grid-cols-3">
					<Figure
						label="Credit score"
						value={
							project.creditScore === null
								? "Not scored"
								: `${project.creditScore} of 100`
						}
						hint={project.creditRating ?? undefined}
					/>
					<Figure
						label="Project risk"
						value={
							project.riskScore === null
								? "Not scored"
								: `${project.riskScore} of 100`
						}
						hint={project.riskLevel ? `${project.riskLevel} risk` : undefined}
					/>
					<Figure
						label="Baseline emissions"
						value={
							project.baselineTco2 === null
								? "Not filled in"
								: `${formatId(project.baselineTco2, 1)} tCO₂`
						}
						hint="Consumption × emission factor."
					/>
				</CardContent>
			</Card>

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">What happens next</h2>
				<ol className="divide-y divide-border border-y border-border">
					{STAGES.map((stage, index) => {
						const state = stageState(index, project.status);
						return (
							<li key={stage.title} className="flex gap-4 py-4">
								<FontAwesomeIcon
									icon={state === "in progress" ? faClock : stage.icon}
									className={cn(
										"mt-0.5 size-4 shrink-0",
										state === "in progress"
											? "text-primary"
											: "text-muted-foreground",
									)}
									aria-hidden
								/>
								<div className="min-w-0">
									<p className="text-sm font-medium">
										{stage.title}
										{state === "waiting" ? "" : ` · ${state}`}
									</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">
										{stage.body}
									</p>
								</div>
							</li>
						);
					})}
				</ol>
				{STAGES_PASSED[project.status] >= STAGES.length && (
					<p className="text-sm text-muted-foreground">
						Both stages are behind this project. Its record, its documents and
						the risk assessment stay on My Projects.
					</p>
				)}
			</section>

			<div className="flex flex-wrap items-center gap-3">
				<Button asChild>
					<Link to="/business/projects">
						View my projects
						<FontAwesomeIcon icon={faArrowRight} aria-hidden />
					</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link to="/business/matchmaking">Go to vendor matchmaking</Link>
				</Button>
				<Button variant="ghost" asChild>
					<Link to="/business/submit">Submit another project</Link>
				</Button>
			</div>
		</div>
	);
}
