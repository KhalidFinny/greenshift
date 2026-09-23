import {
	faFileSignature,
	faGavel,
	faHandshake,
	faTasks,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	EmptyState,
	PaginationBar,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	usePagedRows,
} from "@greenshift/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { formatRupiah, formatShortDate } from "../lib/format";
import { useVendorData } from "../lib/use-vendor-data";
import { ActiveProjectCard } from "../organisms/active-project-card";
import { NegotiationCard } from "../organisms/negotiation-card";
import { OpenBidLeaderboard } from "../organisms/open-bid-leaderboard";
import { ProposalCard } from "../organisms/proposal-card";

type Stage = "live" | "proposals" | "negotiation" | "execution";

export function VendorDealsPage() {
	const {
		isLoading,
		proposals,
		negotiations,
		activeProjects,
		leaderboard,
		leaderboardMeta,
		placeOpenBid,
		submitNegotiationResponse,
	} = useVendorData();

	const navigate = useNavigate();
	const [stage, setStage] = useState<Stage>("live");

	// One proposal per tender, so we can tell which one the standings belong to.
	const openBiddingProposals = proposals.filter(
		(p) =>
			p.procurementMethod === "OPEN_BIDDING" && p.status === "UNDER_EVALUATION",
	);

	// Each stage is its own list, so each pages the rows it renders.
	const openBiddingPage = usePagedRows(openBiddingProposals);
	const proposalsPage = usePagedRows(proposals);
	const negotiationsPage = usePagedRows(negotiations);
	const activeProjectsPage = usePagedRows(activeProjects);

	// Real counts drive the stage strip, so the pipeline reads at a glance.
	const STAGES = [
		{
			key: "live" as const,
			icon: faGavel,
			label: "Live bidding",
			blurb: "Open tenders you are bidding on",
			count: openBiddingProposals.length,
		},
		{
			key: "proposals" as const,
			icon: faFileSignature,
			label: "Proposals",
			blurb: "Submitted, with the client",
			count: proposals.length,
		},
		{
			key: "negotiation" as const,
			icon: faHandshake,
			label: "Negotiation",
			blurb: "Client revision requests",
			count: negotiations.length,
		},
		{
			key: "execution" as const,
			icon: faTasks,
			label: "Execution",
			blurb: "Awarded, delivery in flight",
			count: activeProjects.length,
		},
	];

	const activeStage = STAGES.find((s) => s.key === stage);

	return (
		<div className="space-y-6">
			<Tabs value={stage} onValueChange={(v) => setStage(v as Stage)}>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<TabsList className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 group-data-horizontal/tabs:h-auto">
						{STAGES.map((s) => (
							<TabsTrigger
								key={s.key}
								value={s.key}
								className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#00712D] data-[state=active]:text-white data-[state=active]:shadow-none"
							>
								<FontAwesomeIcon icon={s.icon} />
								<span>{s.label}</span>
								<span className="font-semibold tabular-nums">
									{isLoading ? "-" : s.count}
								</span>
							</TabsTrigger>
						))}
					</TabsList>

					<Link to="/vendor/opportunities">
						<Button variant="outline" className="font-medium">
							Browse open tenders
						</Button>
					</Link>
				</div>

				{/* The active stage's meaning, stated once rather than repeated
				    under every tab. */}
				{activeStage ? (
					<p className="mt-3 text-sm text-muted-foreground">
						{activeStage.blurb}
					</p>
				) : null}

				{/* 1. Live bidding. Standings render only for the tender the
				    leaderboard endpoint actually reports on. */}
				<TabsContent value="live" className="mt-6 space-y-4">
					{!isLoading && openBiddingProposals.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faGavel} />}
							title="You are not bidding on anything open"
							description="Submit a proposal to an Open Bidding tender and its live standings and your rank appear here, so you can revise your price before the deadline."
							action={
								<Link to="/vendor/opportunities">
									<Button>Browse open tenders</Button>
								</Link>
							}
						/>
					) : (
						<>
							<div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
								{openBiddingPage.pageRows.map((prop) => {
									const hasStandings =
										leaderboardMeta.tenderId === prop.tenderId;
									const facts = [
										prop.submittedAt
											? `Submitted ${formatShortDate(prop.submittedAt)}`
											: null,
										hasStandings && leaderboardMeta.myRank
											? `Rank ${leaderboardMeta.myRank} of ${leaderboard.length}`
											: null,
										hasStandings && leaderboardMeta.deadlineAt
											? `Closes ${formatShortDate(leaderboardMeta.deadlineAt)}`
											: null,
										`${prop.revisionCount} revision${prop.revisionCount === 1 ? "" : "s"}`,
									].filter(Boolean);

									return (
										<div key={prop.id} className="p-5">
											<div className="flex flex-wrap items-start justify-between gap-6">
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-3">
														<Badge
															className={
																hasStandings
																	? "bg-emerald-700 text-white"
																	: "bg-muted text-foreground"
															}
														>
															{hasStandings ? "Live" : "Standings pending"}
														</Badge>
														<h4 className="text-base font-semibold text-foreground">
															{prop.projectTitle}
														</h4>
													</div>
													<p className="mt-2 text-sm text-muted-foreground">
														{facts.join(" · ")}
													</p>
												</div>

												<div className="flex items-center gap-6">
													<div className="text-right">
														<p className="text-sm text-muted-foreground">
															Your bid
														</p>
														<p className="text-lg font-bold text-foreground tabular-nums">
															{formatRupiah(prop.costBreakdown.totalPrice)}
														</p>
													</div>
													<Link
														to="/vendor/tenders/$id"
														params={{ id: prop.tenderId }}
													>
														<Button variant="outline">View tender</Button>
													</Link>
												</div>
											</div>

											{hasStandings ? (
												<div className="mt-5">
													<OpenBidLeaderboard
														leaderboard={leaderboard}
														projectTitle={prop.projectTitle}
														projectClient={prop.companyName}
														deadlineAt={leaderboardMeta.deadlineAt}
														onRevise={placeOpenBid}
													/>
												</div>
											) : null}
										</div>
									);
								})}
							</div>
							<PaginationBar
								label="Live bids"
								pageIndex={openBiddingPage.pageIndex}
								pageSize={openBiddingPage.pageSize}
								pageCount={openBiddingPage.pageCount}
								total={openBiddingPage.total}
								onPageIndexChange={openBiddingPage.setPageIndex}
								onPageSizeChange={openBiddingPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="proposals" className="mt-6 space-y-4">
					{!isLoading && proposals.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faFileSignature} />}
							title="No proposals submitted"
							description="A proposal appears here the moment you submit it, with the client's evaluation status alongside."
							action={
								<Link to="/vendor/opportunities">
									<Button>Find a tender</Button>
								</Link>
							}
						/>
					) : (
						<>
							{proposalsPage.pageRows.map((prop) => (
								<ProposalCard key={prop.id} proposal={prop} />
							))}
							<PaginationBar
								label="Proposals"
								pageIndex={proposalsPage.pageIndex}
								pageSize={proposalsPage.pageSize}
								pageCount={proposalsPage.pageCount}
								total={proposalsPage.total}
								onPageIndexChange={proposalsPage.setPageIndex}
								onPageSizeChange={proposalsPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="negotiation" className="mt-6 space-y-4">
					{!isLoading && negotiations.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faHandshake} />}
							title="Nothing under negotiation"
							description="When a client wants different terms, their revision request lands here for you to answer."
						/>
					) : (
						<>
							{negotiationsPage.pageRows.map((neg) => (
								<NegotiationCard
									key={neg.id}
									negotiation={neg}
									onSubmitResponse={submitNegotiationResponse}
								/>
							))}
							<PaginationBar
								label="Negotiations"
								pageIndex={negotiationsPage.pageIndex}
								pageSize={negotiationsPage.pageSize}
								pageCount={negotiationsPage.pageCount}
								total={negotiationsPage.total}
								onPageIndexChange={negotiationsPage.setPageIndex}
								onPageSizeChange={negotiationsPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>

				{/* 4. Execution. Selecting a project opens its own page rather than
				    nesting a second detail view inside this tab. */}
				<TabsContent value="execution" className="mt-6 space-y-4">
					{!isLoading && activeProjects.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faTasks} />}
							title="No projects in execution"
							description="A project moves here when a client awards your proposal and the contract starts. Milestones and energy reporting open on the project's own page."
							action={
								<Link to="/vendor/opportunities">
									<Button>Browse open tenders</Button>
								</Link>
							}
						/>
					) : (
						<>
							{activeProjectsPage.pageRows.map((proj) => (
								<ActiveProjectCard
									key={proj.id}
									project={proj}
									onSelect={() =>
										navigate({
											to: "/vendor/active-projects/$id",
											params: { id: proj.id },
										})
									}
								/>
							))}
							<PaginationBar
								label="Projects in execution"
								pageIndex={activeProjectsPage.pageIndex}
								pageSize={activeProjectsPage.pageSize}
								pageCount={activeProjectsPage.pageCount}
								total={activeProjectsPage.total}
								onPageIndexChange={activeProjectsPage.setPageIndex}
								onPageSizeChange={activeProjectsPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
