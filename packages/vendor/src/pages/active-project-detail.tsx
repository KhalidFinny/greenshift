import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, EmptyState } from "@greenshift/ui";
import { formatDate, formatRupiah } from "../lib/format";
import { MILESTONE_STATUS_LABEL } from "../lib/labels";
import { useVendorData } from "../lib/use-vendor-data";
import { DetailHero, DetailShell } from "../molecules/detail-shell";
import { EnergyForecastCard } from "../organisms/energy-forecast-card";
import { MilestoneTrackerCard } from "../organisms/milestone-tracker-card";
import { MonthlyEnergyReportCard } from "../organisms/monthly-energy-report-card";

export function VendorActiveProjectDetailPage({
	activeProjectId,
}: {
	activeProjectId?: string;
}) {
	const { isLoading, activeProjects, submitMilestoneEvidence } =
		useVendorData();

	const project =
		activeProjects.find((p) => p.id === activeProjectId) ?? activeProjects[0];

	if (!isLoading && !project) {
		return (
			<DetailShell
				backTo="/vendor/deals"
				backLabel="Back to My Deals"
				hero={null}
			>
				<EmptyState
					title="Project not found"
					description="This project is not in your awarded work. Awarded projects appear here once the client confirms the contract."
				/>
			</DetailShell>
		);
	}

	const milestones = project?.milestones ?? [];
	const done = milestones.filter(
		(m) => m.status === "COMPLETED" || m.status === "APPROVED",
	).length;
	const inFlight = milestones.filter(
		(m) => m.status === "IN_PROGRESS" || m.status === "SUBMITTED_FOR_REVIEW",
	).length;
	const outstanding = milestones.length - done - inFlight;

	const currentMilestone = milestones.find(
		(m) => m.title === project?.currentMilestoneTitle,
	);

	return (
		<DetailShell
			backTo="/vendor/deals"
			backLabel="Back to My Deals"
			hero={
				<DetailHero
					loading={isLoading}
					title={project?.title}
					badges={
						<>
							<Badge
								variant="outline"
								className="border-white/30 text-sm text-white"
							>
								{project ? project.status.replace(/_/g, " ") : "In execution"}
							</Badge>
							{project?.deadlineDate ? (
								<div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
									<FontAwesomeIcon icon={faClock} className="text-sm" />
									<span>
										Target completion: {formatDate(project.deadlineDate)}
									</span>
								</div>
							) : null}
						</>
					}
					meta={
						project ? (
							<span className="text-base text-emerald-100/80">
								{project.companyName} · {project.location}
							</span>
						) : null
					}
					stats={[
						{
							label: "Progress",
							value: `${project?.overallProgressPercent ?? "-"}%`,
							tone: "positive",
						},
						{
							label: "Contracted value",
							value: formatRupiah(project?.agreedBudget),
						},
						{
							label: "Energy saving",
							value: `${project?.expectedEnergySavingsPercent ?? "-"}% / yr`,
							tone: "positive",
						},
						{
							label: "Carbon reduction",
							value: `${project?.expectedCarbonReductionTons ?? "-"} tCO₂e/yr`,
						},
					]}
				/>
			}
			aside={
				<div className="rounded-xl border border-border p-5">
					<h3 className="text-lg font-semibold text-foreground">
						Delivery status
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{project?.currentMilestoneTitle
							? `Current: ${project.currentMilestoneTitle}`
							: "No milestone scheduled yet"}
					</p>

					<dl className="mt-5 space-y-3">
						{[
							{ label: "Milestones approved", value: done },
							{ label: "In review", value: inFlight },
							{ label: "Not started", value: outstanding },
						].map((row) => (
							<div
								key={row.label}
								className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
							>
								<dt className="text-sm text-muted-foreground">{row.label}</dt>
								<dd className="text-base font-semibold text-foreground tabular-nums">
									{row.value}
								</dd>
							</div>
						))}
					</dl>

					{currentMilestone ? (
						<p className="mt-5 text-sm text-muted-foreground">
							Current milestone is{" "}
							{MILESTONE_STATUS_LABEL[currentMilestone.status]}.
						</p>
					) : null}
				</div>
			}
		>
			<MilestoneTrackerCard
				projectId={project?.id ?? ""}
				milestones={milestones}
				onSubmitEvidence={submitMilestoneEvidence}
				loading={isLoading}
			/>
			<MonthlyEnergyReportCard
				reports={project?.monthlyReports ?? []}
				loading={isLoading}
			/>
			<EnergyForecastCard
				forecasts={project?.forecasts ?? []}
				loading={isLoading}
			/>
		</DetailShell>
	);
}
