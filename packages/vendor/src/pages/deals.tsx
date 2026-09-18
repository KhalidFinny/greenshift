import {
	faArrowLeft,
	faCheckCircle,
	faGavel,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { useState } from "react";
import { useVendorData } from "../lib/use-vendor-data";
import { ActiveProjectCard } from "../organisms/active-project-card";
import { ActiveProjectHero } from "../organisms/active-project-hero";
import { MilestoneTrackerCard } from "../organisms/milestone-tracker-card";
import { MonthlyEnergyReportCard } from "../organisms/monthly-energy-report-card";
import { NegotiationCard } from "../organisms/negotiation-card";
import { OpenBidLeaderboard } from "../organisms/open-bid-leaderboard";
import { ProposalCard } from "../organisms/proposal-card";

export function VendorDealsPage() {
	const {
		proposals,
		negotiations,
		activeProjects,
		leaderboard,
		placeOpenBid,
		submitMilestoneEvidence,
		submitNegotiationResponse,
	} = useVendorData();

	const [selectedActiveProjectId, setSelectedActiveProjectId] = useState<
		string | null
	>(null);

	const selectedProject = activeProjects.find(
		(p) => p.id === selectedActiveProjectId,
	);

	// Find open bidding proposals (live auctions)
	const openBiddingProposals = proposals.filter(
		(p) =>
			p.procurementMethod === "OPEN_BIDDING" && p.status === "UNDER_EVALUATION",
	);

	return (
		<div className="space-y-6">
			<Tabs defaultValue="live-bidding">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="live-bidding" className="gap-1.5">
						<span className="relative flex size-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
						</span>
						Live Bidding ({openBiddingProposals.length})
					</TabsTrigger>
					<TabsTrigger value="proposals">
						Proposals ({proposals.length})
					</TabsTrigger>
					<TabsTrigger value="negotiations">
						Negotiation ({negotiations.length})
					</TabsTrigger>
					<TabsTrigger value="execution">
						Execution ({activeProjects.length})
					</TabsTrigger>
					<TabsTrigger value="completed">Completed</TabsTrigger>
				</TabsList>

				{/* 1. Live Bidding Tab */}
				<TabsContent value="live-bidding" className="mt-6 space-y-4">
					{openBiddingProposals.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground space-y-3">
								<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
									<FontAwesomeIcon
										icon={faGavel}
										className="text-xl text-muted-foreground"
									/>
								</div>
								<h4 className="font-semibold text-sm text-foreground">
									No Live Bidding in Progress
								</h4>
								<p className="max-w-md mx-auto">
									When you submit a proposal for an Open Bidding tender, you can
									track your ranking and revise your bid price in real-time
									here.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{openBiddingProposals.map((prop) => (
								<div key={prop.id} className="space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<h4 className="text-sm font-semibold text-foreground">
												{prop.projectTitle}
											</h4>
											<p className="text-xs text-muted-foreground">
												{prop.companyName} • Deadline: Sep 12, 2026 17:00
											</p>
										</div>
										<Badge className="bg-emerald-600 text-white">
											<span className="relative flex size-2 mr-1.5">
												<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
												<span className="relative inline-flex size-2 rounded-full bg-white" />
											</span>
											Live
										</Badge>
									</div>

									<OpenBidLeaderboard
										leaderboard={leaderboard}
										projectTitle={prop.projectTitle}
										projectClient={prop.companyName}
										deadline="Sep 12, 2026 17:00"
										onRevise={placeOpenBid}
									/>
								</div>
							))}
						</div>
					)}
				</TabsContent>

				{/* 2. Submitted Proposals Tab */}
				<TabsContent value="proposals" className="mt-6 space-y-4">
					{proposals.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground">
								No proposals currently submitted. Browse Opportunities to submit
								bids.
							</CardContent>
						</Card>
					) : (
						proposals.map((prop) => (
							<ProposalCard key={prop.id} proposal={prop} />
						))
					)}
				</TabsContent>

				{/* 3. In Negotiation Tab */}
				<TabsContent value="negotiations" className="mt-6 space-y-4">
					{negotiations.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center text-xs text-muted-foreground">
								No active negotiations pending at this time.
							</CardContent>
						</Card>
					) : (
						negotiations.map((neg) => (
							<NegotiationCard
								key={neg.id}
								negotiation={neg}
								onSubmitResponse={submitNegotiationResponse}
							/>
						))
					)}
				</TabsContent>

				{/* 4. In Execution Tab */}
				<TabsContent value="execution" className="mt-6 space-y-6">
					{selectedProject ? (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedActiveProjectId(null)}
									className="gap-2 text-xs"
								>
									<FontAwesomeIcon icon={faArrowLeft} />
									Back to Active Projects List
								</Button>
								<span className="text-xs text-muted-foreground">
									Viewing project milestones for {selectedProject.title}
								</span>
							</div>

							<ActiveProjectHero project={selectedProject} />

							<MilestoneTrackerCard
								projectId={selectedProject.id}
								milestones={selectedProject.milestones}
								onSubmitEvidence={submitMilestoneEvidence}
							/>

							<MonthlyEnergyReportCard
								reports={selectedProject.monthlyReports}
							/>
						</div>
					) : (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-base font-semibold text-foreground">
										Concurrent Active Projects ({activeProjects.length})
									</h3>
									<p className="text-xs text-muted-foreground">
										Select any project to drill down into milestone tracking,
										upload execution evidence, and view energy reports.
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-6">
								{activeProjects.map((proj) => (
									<ActiveProjectCard
										key={proj.id}
										project={proj}
										onSelect={() => setSelectedActiveProjectId(proj.id)}
									/>
								))}
							</div>
						</div>
					)}
				</TabsContent>

				{/* 5. Completed Deals Tab */}
				<TabsContent value="completed" className="mt-6 space-y-4">
					<Card>
						<CardContent className="p-8 text-center text-xs text-muted-foreground space-y-2">
							<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
								<FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
							</div>
							<h4 className="font-semibold text-sm text-foreground">
								All Closed & Completed Deals
							</h4>
							<p className="max-w-md mx-auto">
								Completed contracts with finalized BAST (Handover Certificate)
								verification automatically archive into your verified Track
								Record under Portfolio & Performance.
							</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
