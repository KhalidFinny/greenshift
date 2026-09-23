import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, EmptyState } from "@greenshift/ui";
import { useState } from "react";
import { formatRupiah } from "../lib/format";
import { PROCUREMENT_METHOD_LABEL } from "../lib/labels";
import { useVendorData } from "../lib/use-vendor-data";
import { DetailHero, DetailShell } from "../molecules/detail-shell";
import { BidLeaderboard } from "../organisms/bid-leaderboard-card";
import { BlueprintCard } from "../organisms/blueprint-card";
import { BlueprintDialog } from "../organisms/blueprint-dialog";
import { MatchmakingDeepDive } from "../organisms/matchmaking-deep-dive-card";
import { ProjectProcurementActionCard } from "../organisms/project-procurement-action-card";
import { ProjectScopeCard } from "../organisms/project-scope-card";
import { SubmitProposalDialog } from "../organisms/submit-proposal-dialog";

export function VendorProjectDetailPage({ projectId }: { projectId?: string }) {
	const {
		isLoading,
		projects,
		verification,
		proposals,
		leaderboard,
		blueprint,
		projectDetailCard,
		projectDetailLoading,
		submitProposal,
		reviseProposal,
	} = useVendorData({ projectId });
	const [showProposalModal, setShowProposalModal] = useState(false);
	const [showBlueprintModal, setShowBlueprintModal] = useState(false);

	// The market list is capped, so a tender past the cap is read from its own detail.
	const project =
		projects.find((p) => p.id === projectId) ?? projectDetailCard ?? undefined;

	// The detail read has to land before the tender counts as missing.
	if (!isLoading && !project && !projectDetailLoading) {
		return (
			<DetailShell
				backTo="/vendor/opportunities"
				backLabel="Back to Discover"
				hero={null}
			>
				<EmptyState
					title="Tender not found"
					description="This tender is no longer open or has been withdrawn by the client."
				/>
			</DetailShell>
		);
	}

	const isVerified = verification.status === "VERIFIED";
	const myProposal = project
		? (proposals.find((proposal) => proposal.projectId === project.id) ?? null)
		: null;
	const applied = myProposal !== null;
	const isOpenBidding = project?.procurementMethod === "OPEN_BIDDING";

	const daysLeft = project
		? Math.ceil(
				(new Date(project.tenderDeadlineAt).getTime() - Date.now()) /
					(1000 * 60 * 60 * 24),
			)
		: 0;
	const isUrgent = !isLoading && daysLeft <= 7;

	return (
		<DetailShell
			backTo="/vendor/opportunities"
			backLabel="Back to Discover"
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
								{
									PROCUREMENT_METHOD_LABEL[
										project?.procurementMethod ?? "OPEN_BIDDING"
									]
								}
							</Badge>
							{project ? (
								<div
									className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
										isUrgent
											? "bg-red-500/20 text-red-200"
											: "bg-white/10 text-emerald-200"
									}`}
								>
									<FontAwesomeIcon icon={faClock} className="text-sm" />
									<span>
										Deadline:{" "}
										{new Date(project.tenderDeadlineAt).toLocaleDateString(
											"en-US",
											{ dateStyle: "medium" },
										)}
									</span>
									{daysLeft > 0 ? (
										<span
											className={`rounded px-2 py-0.5 text-sm font-bold ${
												isUrgent ? "bg-red-700 text-white" : "bg-white/20"
											}`}
										>
											{daysLeft}d left
										</span>
									) : null}
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
							label: "Client Budget",
							value: formatRupiah(project?.clientBudget),
						},
						{
							label: "Project Value",
							value: formatRupiah(project?.estimatedValue),
						},
						{
							label: "Carbon Target",
							value: `${project?.carbonReductionTargetTons ?? "-"} tCO₂e/yr`,
							tone: "positive",
						},
						{
							label: "Risk Rating",
							value: `${project?.riskScore ?? "-"}/100`,
						},
					]}
				/>
			}
			aside={
				<>
					<ProjectProcurementActionCard
						isVerified={isVerified}
						procurementMethod={project?.procurementMethod ?? "OPEN_BIDDING"}
						applied={applied}
						onOpenProposal={() => setShowProposalModal(true)}
						onViewBlueprint={() => setShowBlueprintModal(true)}
						loading={isLoading}
					/>

					{isOpenBidding ? (
						<div className="rounded-xl border border-border p-5">
							<BidLeaderboard leaderboard={leaderboard} loading={isLoading} />
						</div>
					) : null}
				</>
			}
		>
			<ProjectScopeCard project={project} loading={isLoading} />
			<BlueprintCard
				blueprint={blueprint}
				loading={projectDetailLoading && projectId !== undefined}
			/>
			<MatchmakingDeepDive
				matchmaking={project?.matchmaking}
				loading={isLoading}
			/>

			{project ? (
				<SubmitProposalDialog
					project={project}
					myProposal={
						myProposal
							? {
									id: Number(myProposal.id),
									amount: myProposal.costBreakdown.totalPrice,
									documentName: myProposal.documentName,
									documentUrl: myProposal.documentUrl,
								}
							: null
					}
					onSubmit={(data, file) => submitProposal({ fields: data, file })}
					onRevise={(data, file) => reviseProposal({ ...data, file })}
					isOpen={showProposalModal}
					onOpenChange={setShowProposalModal}
					onViewBlueprint={() => setShowBlueprintModal(true)}
				/>
			) : null}

			<BlueprintDialog
				blueprint={blueprint}
				loading={projectDetailLoading && projectId !== undefined}
				isOpen={showBlueprintModal}
				onOpenChange={setShowBlueprintModal}
			/>
		</DetailShell>
	);
}
