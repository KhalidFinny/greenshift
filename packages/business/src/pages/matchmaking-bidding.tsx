/* Bidding phase for one project: the tender, its bids, the verdicts. A bid is the
 * vendor's proposal doc, marks in page coordinates; a tender settles only by award. */

import {
	faCircleCheck,
	faFileLines,
	faFilePdf,
	faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	ApiError,
	api,
	type BusinessBidNegotiation,
	type BusinessProcurementBid,
} from "@greenshift/core";
import {
	AnnotatedProposal,
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	EmptyState,
	PaginationBar,
	type ProposalAnnotation,
	type ProposalDocumentData,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { formatId } from "../lib/number-format";
import { formatSubmittedAt } from "../lib/project-display";
import {
	deadlinePhrase,
	ProjectFacts,
	StageBand,
	stageIndex,
	stageSummary,
} from "./matchmaking-shared";

const BID_STATUS_LABEL: Record<string, string> = {
	submitted: "Submitted",
	reviewed: "Reviewed",
	revision: "Revision requested",
	accepted: "Accepted",
	rejected: "Rejected",
};

function warrantyLabel(months: number | null): string {
	return months === null ? "Not stated" : `${months} months`;
}

/** The bid as the proposal document both sides read. */
function toProposal(
	bid: BusinessProcurementBid,
	projectTitle: string,
): ProposalDocumentData {
	return {
		title: projectTitle,
		vendorName: bid.vendorName,
		submittedAt: bid.submittedAt,
		amount: bid.amount,
		operationalCost: bid.operationalCost,
		projectedRoi: bid.projectedRoi,
		warrantyPeriod: bid.warrantyPeriod,
		technicalSpec: bid.technicalSpec,
		revisionCount: bid.revisionCount,
	};
}

/** One round: the company's ask and the vendor's answer. */
function RevisionRound({
	round,
	onViewMarks,
}: {
	round: BusinessBidNegotiation;
	onViewMarks: () => void;
}) {
	return (
		<li className="rounded-lg border border-border bg-muted/30 p-3.5">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<p className="text-sm font-semibold">
					Revision {round.iterationNumber}
					<span className="ml-2 font-normal text-muted-foreground">
						{formatSubmittedAt(round.createdAt)}
					</span>
				</p>
				<p className="text-sm text-muted-foreground">
					{round.respondedAt
						? `Answered ${formatSubmittedAt(round.respondedAt)}`
						: "Awaiting the vendor"}
				</p>
			</div>

			<p className="mt-2 text-sm leading-6">{round.companyNote}</p>

			{round.annotations.length > 0 ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-2.5"
					onClick={onViewMarks}
				>
					<FontAwesomeIcon icon={faFileLines} aria-hidden />
					{`See the ${round.annotations.length} mark${
						round.annotations.length === 1 ? "" : "s"
					} on the proposal`}
				</Button>
			) : null}

			{round.vendorResponseNote ||
			round.vendorRevisedPrice !== null ||
			round.vendorRevisedWarrantyYears !== null ? (
				<div className="mt-3 border-t border-border pt-2.5">
					<p className="text-sm font-medium text-muted-foreground">
						The vendor answered
					</p>
					{round.vendorResponseNote ? (
						<p className="mt-1 text-sm leading-6">{round.vendorResponseNote}</p>
					) : null}
					{round.vendorRevisedPrice !== null ||
					round.vendorRevisedWarrantyYears !== null ? (
						<p className="mt-1.5 text-sm font-semibold tabular-nums">
							{round.vendorRevisedPrice !== null
								? `Now Rp ${formatId(round.vendorRevisedPrice)}`
								: ""}
							{round.vendorRevisedPrice !== null &&
							round.vendorRevisedWarrantyYears !== null
								? " · "
								: ""}
							{round.vendorRevisedWarrantyYears !== null
								? `${round.vendorRevisedWarrantyYears} months of warranty`
								: ""}
						</p>
					) : null}
				</div>
			) : null}
		</li>
	);
}

/** One offer, with the verdicts the company can pass on it. */
function BidRow({
	bid,
	projectTitle,
	winner,
	reviewable,
	busy,
	onReview,
	onAward,
}: {
	bid: BusinessProcurementBid;
	projectTitle: string;
	winner: boolean;
	reviewable: boolean;
	busy: boolean;
	onReview: (
		decision: "revision" | "reject",
		note: string | null,
		annotations: ProposalAnnotation[],
	) => void;
	onAward: () => void;
}) {
	const [note, setNote] = useState("");
	const [marks, setMarks] = useState<ProposalAnnotation[]>([]);
	const [revisionOpen, setRevisionOpen] = useState(false);
	const [reading, setReading] = useState<ProposalAnnotation[] | null>(null);

	// A bid can carry any number of rounds, so the thread pages like every other record list.
	const rounds = usePagedRows(bid.negotiations);

	const proposal = toProposal(bid, projectTitle);

	/* A round the vendor has not answered holds the bid: the API refuses both
	   accepting it and asking for another, so the controls do the same. */
	const openRound = bid.negotiations.find(
		(round) => round.status === "PENDING_VENDOR_RESPONSE",
	);
	const waitingOnVendor = openRound !== undefined;

	/** Closing the revision puts the marks back: they belong to the next ask. */
	function closeRevision() {
		setRevisionOpen(false);
		setMarks([]);
		setNote("");
	}

	return (
		<div
			className={cn(
				"rounded-xl border bg-card p-4",
				winner ? "border-primary" : "border-border",
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
				<div className="min-w-0">
					<p className="flex items-center gap-2 text-sm font-semibold">
						{bid.vendorName}
						{winner && (
							<>
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="size-4 text-primary"
									aria-label="Awarded this tender"
								/>
								<Badge className="bg-primary text-primary-foreground">
									Awarded
								</Badge>
							</>
						)}
					</p>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{formatSubmittedAt(bid.submittedAt)}
						{bid.revisionCount > 0
							? ` · ${bid.revisionCount} revision${bid.revisionCount === 1 ? "" : "s"}`
							: ""}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xl font-semibold tabular-nums">
						Rp {formatId(bid.amount)}
					</p>
					<p className="text-sm text-muted-foreground">
						{BID_STATUS_LABEL[bid.status] ?? bid.status}
					</p>
				</div>
			</div>

			<dl className="mt-3 grid gap-x-6 gap-y-2 border-t border-border pt-3 sm:grid-cols-3">
				{[
					{
						label: "Operating cost",
						value:
							bid.operationalCost === null
								? "Not stated"
								: `Rp ${formatId(bid.operationalCost)}`,
					},
					{
						label: "Projected ROI",
						value:
							bid.projectedRoi === null ? "Not stated" : `${bid.projectedRoi}%`,
					},
					{ label: "Warranty", value: warrantyLabel(bid.warrantyPeriod) },
				].map((fact) => (
					<div key={fact.label}>
						<dt className="text-sm text-muted-foreground">{fact.label}</dt>
						<dd className="text-sm tabular-nums">{fact.value}</dd>
					</div>
				))}
			</dl>

			{bid.technicalSpec && (
				<p className="mt-3 text-sm leading-6 text-muted-foreground">
					{bid.technicalSpec}
				</p>
			)}

			{/* The bidder's written case: the document filed with the bid, absent when there was none. */}
			{bid.documentUrl ? (
				<a
					href={bid.documentUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
				>
					<FontAwesomeIcon icon={faFilePdf} aria-hidden />
					{bid.documentName ?? "Proposal document (PDF)"}
				</a>
			) : (
				<p className="mt-3 text-sm text-muted-foreground">
					No proposal document was filed with this bid.
				</p>
			)}

			{bid.negotiations.length > 0 ? (
				<section className="mt-4 border-t border-border pt-3.5">
					<h3 className="text-sm font-semibold">Revision history</h3>
					<ol className="mt-2.5 space-y-2.5">
						{rounds.pageRows.map((round) => (
							<RevisionRound
								key={round.id}
								round={round}
								onViewMarks={() => setReading(round.annotations)}
							/>
						))}
					</ol>
					<PaginationBar
						label={`${bid.vendorName} revision history`}
						pageIndex={rounds.pageIndex}
						pageSize={rounds.pageSize}
						pageCount={rounds.pageCount}
						total={rounds.total}
						onPageIndexChange={rounds.setPageIndex}
						onPageSizeChange={rounds.setPageSize}
					/>
				</section>
			) : null}

			{reviewable && waitingOnVendor ? (
				<p className="mt-4 rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground">
					Waiting on {bid.vendorName} to answer revision{" "}
					{openRound?.iterationNumber ?? ""}. This bid can be awarded or revised
					again once it is answered.
				</p>
			) : null}

			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={busy}
					onClick={() => setReading([])}
				>
					<FontAwesomeIcon icon={faFileLines} aria-hidden />
					Read the proposal
				</Button>
				{reviewable && (
					<>
						<Button
							type="button"
							disabled={busy || waitingOnVendor}
							onClick={onAward}
						>
							Accept &amp; award
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={busy || waitingOnVendor}
							onClick={() => setRevisionOpen(true)}
						>
							Ask for a revision
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={busy}
							onClick={() => onReview("reject", null, [])}
						>
							Reject
						</Button>
					</>
				)}
			</div>

			{/* Reading: the marked proposal, no drawing tools, because this reader is not the one
			    asking. */}
			<Dialog
				open={reading !== null}
				onOpenChange={(open) => {
					if (!open) setReading(null);
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle className="text-lg">
							{bid.vendorName} · proposal
						</DialogTitle>
						<DialogDescription className="text-base">
							{reading && reading.length > 0
								? `The marks this revision asked about (${reading.length}).`
								: "The bid as it was submitted."}
						</DialogDescription>
					</DialogHeader>
					<AnnotatedProposal proposal={proposal} marks={reading ?? []} />
				</DialogContent>
			</Dialog>

			<Dialog
				open={revisionOpen}
				onOpenChange={(open) => {
					if (!open) closeRevision();
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle className="text-lg">
							Ask {bid.vendorName} to revise
						</DialogTitle>
						<DialogDescription className="text-base">
							Mark what has to change on the proposal, then say why. Both go to
							the vendor as one request.
						</DialogDescription>
					</DialogHeader>

					<AnnotatedProposal
						proposal={proposal}
						marks={marks}
						onMarksChange={setMarks}
					/>

					<div className="space-y-2">
						<label
							className="block text-sm font-medium"
							htmlFor={`note-${bid.id}`}
						>
							What should {bid.vendorName} change?
						</label>
						<textarea
							id={`note-${bid.id}`}
							value={note}
							onChange={(event) => setNote(event.target.value)}
							rows={3}
							className="w-full rounded-md border border-border bg-background p-3 text-sm"
							placeholder="Say what would make it acceptable."
						/>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<Button type="button" variant="outline" onClick={closeRevision}>
								Cancel
							</Button>
							<Button
								type="button"
								disabled={busy || note.trim().length === 0}
								onClick={() => {
									onReview("revision", note.trim(), marks);
									closeRevision();
								}}
							>
								Send the revision request
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function MatchmakingBidding({ projectId }: { projectId: string }) {
	const id = Number(projectId);
	const queryClient = useQueryClient();
	const [busy, setBusy] = useState(false);

	const detailQuery = useQuery({
		queryKey: ["business", "matchmaking", id],
		enabled: Number.isInteger(id),
		queryFn: async () => api.business.matchmakingDetail(id),
	});

	// The bids are a record list like any other: it pages because nothing bounds how many bid.
	const bidPage = usePagedRows(detailQuery.data?.bids ?? []);

	async function act(action: () => Promise<unknown>) {
		setBusy(true);
		try {
			await action();
			await queryClient.invalidateQueries({
				queryKey: ["business", "matchmaking"],
			});
		} catch {
			// The shared client already reported the failure as a toast.
		} finally {
			setBusy(false);
		}
	}

	if (detailQuery.isPending) {
		return <ShimmerBlock className="h-96 w-full rounded-xl" />;
	}

	if (detailQuery.isError || !detailQuery.data) {
		const missing =
			detailQuery.error instanceof ApiError && detailQuery.error.status === 404;
		return (
			<EmptyState
				tone={missing ? "neutral" : "error"}
				title={missing ? "Project not found" : "This project did not load"}
				description={
					missing
						? "It is not one of your projects."
						: "The matchmaking endpoint could not be reached."
				}
				action={
					<Button variant="outline" onClick={() => detailQuery.refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const detail = detailQuery.data;
	const tender = detail.tender;

	// No tender means the ranking page has not opened one; nothing to bid on here.
	if (!tender) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-xl font-semibold">Vendor Matchmaking</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{detail.project.name}
					</p>
				</div>
				<EmptyState
					title="No tender is open"
					description="Appoint a vendor and choose the route on the ranking page, and the bidding phase starts here."
					action={
						<Button asChild>
							<Link
								to="/business/matchmaking/$projectId"
								params={{ projectId }}
							>
								Go to the vendor ranking
							</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
				<div>
					<h1 className="text-xl font-semibold">Vendor Matchmaking</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{detail.project.name}
					</p>
				</div>
				{/* Once awarded, matchmaking is settled: the way back is the list of projects. */}
				{tender.status === "awarded" ? (
					<Button variant="outline" asChild>
						<Link to="/business/matchmaking">Back to my matchmaking</Link>
					</Button>
				) : (
					<Button variant="outline" asChild>
						<Link to="/business/matchmaking/$projectId" params={{ projectId }}>
							Back to vendor matchmaking
						</Link>
					</Button>
				)}
			</div>

			<StageBand
				index={stageIndex(detail.selectedVendorId, tender)}
				summary={stageSummary(tender, tender.awardedVendorName)}
				tender={tender}
			>
				<div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
					<ProjectFacts detail={detail} />
					<div className="flex flex-wrap items-center gap-3">
						{tender.status === "open" && (
							<Button
								disabled={busy}
								onClick={() => void act(() => api.business.closeTender(id))}
							>
								Close bidding
							</Button>
						)}
						{tender.status === "open" && (
							<span className="text-sm text-muted-foreground">
								Closes {formatSubmittedAt(tender.deadlineAt)} ·{" "}
								{deadlinePhrase(tender.deadlineAt)}
							</span>
						)}
					</div>
				</div>
			</StageBand>

			<section className="space-y-3">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<h2 className="text-lg font-semibold">Bids</h2>
					{/* The order is the amount, which the row shows; no second scoring model needed. */}
					<p className="text-sm text-muted-foreground">Lowest bid first</p>
				</div>

				{detail.bids.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border px-5 py-6">
						<p className="flex items-center gap-2 text-sm font-medium">
							<FontAwesomeIcon
								icon={faHourglassHalf}
								className="size-4 text-muted-foreground"
								aria-hidden
							/>
							Waiting on bids
						</p>
						<p className="mt-1.5 text-sm text-muted-foreground">
							{tender.status === "open"
								? `The invited vendors can bid until the deadline, ${deadlinePhrase(tender.deadlineAt)}.`
								: "Bidding closed with no bids on this tender."}
						</p>
					</div>
				) : (
					<>
						<div className="space-y-3">
							{bidPage.pageRows.map((bid) => (
								<BidRow
									key={bid.id}
									bid={bid}
									projectTitle={detail.project.name}
									busy={busy}
									onAward={() =>
										void act(() =>
											api.business.awardBid(id, { proposalId: bid.id }),
										)
									}
									onReview={(decision, note, annotations) =>
										void act(() =>
											api.business.reviewBid(id, bid.id, {
												decision,
												note,
												annotations,
											}),
										)
									}
									reviewable={tender.status === "evaluation"}
									winner={bid.id === tender.awardedProposalId}
								/>
							))}
						</div>
						<PaginationBar
							label="Bids"
							pageIndex={bidPage.pageIndex}
							pageSize={bidPage.pageSize}
							pageCount={bidPage.pageCount}
							total={bidPage.total}
							onPageIndexChange={bidPage.setPageIndex}
							onPageSizeChange={bidPage.setPageSize}
						/>
					</>
				)}
			</section>
		</div>
	);
}
