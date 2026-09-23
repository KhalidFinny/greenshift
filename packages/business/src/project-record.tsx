/* One project's own record: the summary the company filed, the Green Project
 * Blueprint it became, and the two things that follow it.
 *
 * The summary is `ProjectSummary`, the same component the wizard's review step
 * renders, read here from the stored project instead of from a form. The page a
 * company opens on a filed project is therefore the case it submitted, which is
 * also what the blueprint is generated from: the two are the same case at two
 * stages, and both belong on this page.
 *
 * What the record adds is the verification step. The LVV body has its own
 * system, so the project is registered at Sistem Registri, the documents it
 * needs are uploaded there and the body is appointed before verification runs:
 * that is the company's move to make, which is why it is a reminder that stays
 * on this page rather than something the platform does behind them.
 */

import {
	faClock,
	faHandshake,
	faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiError, api, publishToast } from "@greenshift/core";
import { Button, cn, EmptyState, ShimmerBlock } from "@greenshift/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProjectBlueprintSection } from "./views/project-blueprint";
import {
	ProjectSummary,
	type SummaryDocumentRow,
} from "./views/project-summary";
import { REQUIRED_DOCS } from "./views/step-1";

/** The two stages the project passes through after submit, in order. */
const STAGES = [
	{
		icon: faShieldHalved,
		title: "LVV verification",
		body: "The project is registered at Sistem Registri and an LVV body appointed to verify it. Its verdict arrives in your notifications, on the project's own record.",
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
	// The project is on record and waiting on the company, so verification has
	// not started either way.
	registry: 0,
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

/**
 * Whether verification has cleared the project, which is what opens vendor
 * matchmaking. A route offered before that would lead to an empty screen.
 */
export function isMatchmakingOpen(status: string): boolean {
	return (STAGES_PASSED[status] ?? 0) >= 1;
}

/** What the verification step is waiting on, in the stored status's own words. */
function verificationState(
	status: string,
	registered: boolean | undefined,
): { label: string; body: string } {
	switch (status) {
		case "registry":
			return registered
				? {
						label: "Registered at Sistem Registri, not started here",
						body: "The registration is done at the registry, so the only step left is starting the verification here. Press the button and the LVV body you appointed takes over.",
					}
				: {
						label: "Waiting on your registration",
						body: "Register this project at Sistem Registri and appoint the LVV body that will verify it, then mark it registered here and verification starts.",
					};
		case "assessment":
			return {
				label: "Awaiting LVV verification",
				body: "Your LVV body is checking the project against the registry record. Its verdict arrives in your notifications, and a verified project goes on to vendor matchmaking.",
			};
		default:
			return {
				label: "Verified",
				body: "An LVV body has verified the project. Its Green Project Blueprint is generated from this summary, and vendor matchmaking is open.",
			};
	}
}

/**
 * The verification reminder: what the company has to do, whether the registry
 * already holds it, and the one action that starts verification. It stays on the
 * page in every state, so the step is never a page the company has to remember.
 *
 * The registration itself happens at Sistem Registri, outside the platform, which
 * is why the page reads the registry back: a project that is registered there and
 * still waiting here is a company that did the first half and has nothing left to
 * do but press the button, and one that is not registered anywhere is told what
 * the step is.
 */
function VerificationSection({
	projectId,
	status,
}: {
	projectId: number;
	status: string;
}) {
	const queryClient = useQueryClient();

	// Asked only while the project is still waiting on it: once verification is
	// under way or done, the registry has nothing left to tell this page.
	const registry = useQuery({
		queryKey: ["business", "registry", projectId],
		enabled: status === "registry",
		queryFn: async () => (await api.business.registry(projectId)).registered,
		staleTime: 5 * 60 * 1000,
	});

	const state = verificationState(status, registry.data);

	/* The registry read is a live call to another system, so the line says what it
	   is waiting for instead of claiming the project is unregistered until the
	   answer lands. */
	const label =
		status === "registry" && registry.isPending
			? "Checking Sistem Registri…"
			: state.label;

	const start = useMutation({
		mutationFn: async () => (await api.business.startLvv(projectId)).project,
		onSuccess: async (project) => {
			// The response is the project as it now stands, so the page and its
			// pill update without waiting for a refetch.
			queryClient.setQueryData(["business", "project", projectId], project);
			await queryClient.invalidateQueries({
				queryKey: ["business", "projects"],
			});
			publishToast({
				tone: "success",
				title: "Verification started",
				message: `"${project.title}" is with its LVV body.`,
			});
		},
		onError: () =>
			publishToast({
				tone: "error",
				message: "Verification could not be started. Try again.",
			}),
	});

	return (
		<section className="space-y-4">
			<div className="border-b border-border pb-3">
				<h2 className="text-lg font-semibold">Next: LVV verification</h2>
				<p className="mt-1 text-sm text-muted-foreground">{state.body}</p>
			</div>

			{status === "registry" && registry.data === true ? (
				<p className="rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
					Sistem Registri already holds this project. Nothing is left to
					register: start the verification here and the body you appointed takes
					it from there.
				</p>
			) : null}

			<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-5 py-4">
				<p className="text-sm">
					<span className="font-semibold">Status: </span>
					{label}
				</p>
				{status === "registry" ? (
					<Button
						type="button"
						onClick={() => start.mutate()}
						disabled={start.isPending}
					>
						{start.isPending
							? "Starting verification…"
							: "Mark registered and start verification"}
					</Button>
				) : null}
			</div>
		</section>
	);
}

export function ProjectRecord({ projectId }: { projectId: string }) {
	const id = Number(projectId);
	const enabled = Number.isSafeInteger(id);

	const projectQuery = useQuery({
		queryKey: ["business", "project", id],
		enabled,
		queryFn: async () => (await api.business.project(id)).project,
		staleTime: 60 * 1000,
	});

	const documentsQuery = useQuery({
		queryKey: ["business", "documents", id],
		enabled,
		queryFn: async () => (await api.business.documents(id)).documents,
		staleTime: 60 * 1000,
	});

	const blueprintQuery = useQuery({
		queryKey: ["business", "blueprint", id],
		enabled,
		queryFn: async () => (await api.business.blueprint(id)).blueprint,
		staleTime: 60 * 1000,
	});

	const riskQuery = useQuery({
		queryKey: ["business", "risk", id],
		enabled,
		queryFn: async () => (await api.business.risk(id)).risk,
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

	/* The stored files, read back under the slot each was uploaded into, which
	   is what names it in the same words the company filed it under. */
	const stored = Object.fromEntries(
		(documentsQuery.data ?? []).map(
			(document) => [document.slot, document] as const,
		),
	);
	const rowsFor = (
		slots: ReadonlyArray<{ id: string; label: string }>,
	): SummaryDocumentRow[] =>
		slots.map((slot) => {
			const file = stored[slot.id];
			return {
				id: slot.id,
				label: slot.label,
				name: file?.fileName,
				// Null while the file is still being read, so the row offers no
				// link that would answer with a 409.
				downloadUrl: file?.downloadUrl ?? undefined,
			};
		});

	const funding = project.funding;

	return (
		<div className="space-y-10">
			{/* Two columns once there is room for them: the summary the company
			    filed on one side, the document it became and the step that
			    follows it on the other. Stacked below `xl`, where half a screen
			    would leave the charts and the tables too narrow to read. */}
			<div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
				<ProjectSummary
					context="record"
					funding={funding}
					project={{
						namaProyek: project.title,
						lokasi: project.location ?? "",
						sektor: project.sector ?? "",
						jaminan: funding.jaminan,
					}}
					scope={{
						requirements: project.technicalRequirements,
						deliverables: project.deliverables,
					}}
					risk={riskQuery.data ?? null}
					vendorDocs={rowsFor(REQUIRED_DOCS)}
				/>

				<div className="space-y-10">
					<ProjectBlueprintSection
						blueprint={blueprintQuery.data ?? null}
						loading={blueprintQuery.isPending}
					/>

					<VerificationSection projectId={id} status={project.status} />
				</div>
			</div>

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">What happens next</h2>
				<ol className="grid gap-4 sm:grid-cols-2">
					{STAGES.map((stage, index) => {
						const state = stageState(index, project.status);
						return (
							<li
								key={stage.title}
								className="flex gap-4 rounded-xl border border-border p-4"
							>
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
						Both stages are behind this project. Its summary, its documents and
						the risk assessment stay here.
					</p>
				)}
			</section>
		</div>
	);
}
