/* The bidding phase for one project: the tender a route choice opened, the bids
 * on it, and the company's verdict on each.
 *
 * It is its own page because it is its own phase. The ranking page decides who
 * is invited and on what terms; this one reads what came back and decides who
 * wins, and nothing here is reachable until a tender exists.
 */

import {
	faArrowLeft,
	faCircleCheck,
	faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiError, api, type BusinessProcurementBid } from "@greenshift/core";
import { Badge, Button, cn, EmptyState, ShimmerBlock } from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { formatId } from "./lib/number-format";
import { formatSubmittedAt } from "./lib/project-display";
import {
	deadlinePhrase,
	ProjectFacts,
	StageBand,
	stageIndex,
	stageSummary,
} from "./matchmaking-shared";

/**
 * The weights the offers are scored on, in the order the header lists them. The
 * score is the weighted mean of the figures a bid states, so a bid that leaves
 * one out is scored on the rest alone rather than being marked down for it.
 */
const OFFER_WEIGHTS =
	"price 35, operating cost 20, ROI 20, warranty 15, scope 10. A figure a bid does not state is left out, and the rest are reweighted.";

/** What each state of a bid reads as on its row. */
const BID_STATUS_LABEL: Record<string, string> = {
	submitted: "Submitted",
	reviewed: "Reviewed",
	revision: "Revision requested",
	accepted: "Accepted",
	rejected: "Rejected",
};

/** Months of warranty, or an honest blank. */
function warrantyLabel(months: number | null): string {
	return months === null ? "Not stated" : `${months} months`;
}

/** One offer, with the verdicts the company can pass on it. */
function BidRow({
	bid,
	winner,
	reviewable,
	busy,
	onReview,
	onAward,
}: {
	bid: BusinessProcurementBid;
	winner: boolean;
	reviewable: boolean;
	busy: boolean;
	onReview: (
		decision: "accept" | "revision" | "reject",
		note: string | null,
	) => void;
	onAward: () => void;
}) {
	const [note, setNote] = useState("");
	const [revisionOpen, setRevisionOpen] = useState(false);

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
					<p className="flex items-baseline justify-end gap-2">
						<span className="text-xl font-semibold tabular-nums">
							Rp {formatId(bid.amount)}
						</span>
						{bid.score !== null && (
							<Badge className="bg-primary/10 text-primary">
								{bid.score} offer
							</Badge>
						)}
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

			{reviewable && (
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Button type="button" disabled={busy} onClick={onAward}>
						Award this bid
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => onReview("accept", null)}
					>
						Accept
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						aria-expanded={revisionOpen}
						onClick={() => setRevisionOpen((open) => !open)}
					>
						Ask for a revision
					</Button>
					<Button
						type="button"
						variant="ghost"
						disabled={busy}
						onClick={() => onReview("reject", null)}
					>
						Reject
					</Button>
				</div>
			)}

			{revisionOpen && (
				<div className="mt-3 space-y-2">
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
					<Button
						type="button"
						disabled={busy || note.trim().length === 0}
						onClick={() => {
							onReview("revision", note.trim());
							setRevisionOpen(false);
						}}
					>
						Send the revision request
					</Button>
				</div>
			)}
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

	// No tender means the ranking page has not opened one yet, so there is
	// nothing to bid on and this page says so rather than showing an empty list.
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
				{/* Once the tender is awarded, matchmaking is settled: the ranking has
				    nothing left to decide, so the way back is the list of projects. */}
				{tender.status === "awarded" ? (
					<Button variant="outline" asChild>
						<Link to="/business/matchmaking">
							<FontAwesomeIcon icon={faArrowLeft} aria-hidden />
							Back to my matchmaking
						</Link>
					</Button>
				) : (
					<Button variant="outline" asChild>
						<Link to="/business/matchmaking/$projectId" params={{ projectId }}>
							<FontAwesomeIcon icon={faArrowLeft} aria-hidden />
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
					<p className="text-sm text-muted-foreground">
						Scored on {OFFER_WEIGHTS}
					</p>
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
					<div className="space-y-3">
						{detail.bids.map((bid) => (
							<BidRow
								key={bid.id}
								bid={bid}
								busy={busy}
								onAward={() =>
									void act(() =>
										api.business.awardBid(id, { proposalId: bid.id }),
									)
								}
								onReview={(decision, note) =>
									void act(() =>
										api.business.reviewBid(id, bid.id, { decision, note }),
									)
								}
								reviewable={tender.status === "evaluation"}
								winner={bid.id === tender.awardedProposalId}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
