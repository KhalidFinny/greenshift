import { faFileLines, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ProposalDetail } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	AnnotatedProposal,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	type ProposalDocumentData,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatRupiah } from "../lib/format";
import type { NegotiationRequest } from "../lib/types";

interface NegotiationCardProps {
	negotiation: NegotiationRequest;
	onSubmitResponse: (
		negId: string,
		revisedPrice?: number,
		revisedWarranty?: number,
		revisedTimeline?: number,
		note?: string,
	) => void;
}

/**
 * Negotiation state as a chip. Every state pairs its colour with the word, per
 * the palette rules in DESIGN.md: amber while the vendor owes a response,
 * emerald once settled, blue only for the genuinely informational "waiting on
 * the client" state, and the foreground colour when no action is possible.
 * Each pairing is 700-on-50 and verified against its own tint: amber 4.85:1,
 * emerald 5.09:1, blue 6.28:1.
 */
const STATUS_META: Record<
	NegotiationRequest["status"],
	{ label: string; className: string }
> = {
	PENDING_VENDOR_RESPONSE: {
		label: "Awaiting your response",
		className: "border-amber-600/30 bg-amber-50 text-amber-700",
	},
	SUBMITTED_BY_VENDOR: {
		label: "Waiting on the client",
		className: "border-blue-600/30 bg-blue-50 text-blue-700",
	},
	AGREED: {
		label: "Agreed",
		className: "border-emerald-600/30 bg-emerald-50 text-emerald-700",
	},
	LOCKED: {
		label: "Locked",
		className: "border-border bg-muted text-foreground",
	},
};

function RespondNegotiationDialog({
	negotiation,
	onSubmitResponse,
}: NegotiationCardProps) {
	const [open, setOpen] = useState(false);
	// Seeded from the vendor's own earlier counter-offer, and otherwise empty:
	// a pre-filled price or justification would be our number, not theirs.
	const [revisedPrice, setRevisedPrice] = useState(
		negotiation.vendorRevisedPrice?.toString() ?? "",
	);
	const [revisedWarranty, setRevisedWarranty] = useState(
		negotiation.vendorRevisedWarrantyYears?.toString() ?? "",
	);
	const [note, setNote] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSubmitResponse(
			negotiation.id,
			Number(revisedPrice),
			Number(revisedWarranty),
			undefined,
			note,
		);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
				>
					Respond to Revision ({negotiation.iterationNumber}/
					{negotiation.maxIterations})
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>
						Structured Negotiation Response (Revision{" "}
						{negotiation.iterationNumber} of {negotiation.maxIterations})
					</DialogTitle>
					<DialogDescription className="text-base">
						{negotiation.projectTitle} · {negotiation.companyName}
					</DialogDescription>
				</DialogHeader>

				{/* What was asked, beside what the vendor answers: the request is
				    read while the counter-offer is written, rather than scrolled
				    past above it. */}
				<form
					onSubmit={handleSubmit}
					className="grid gap-6 pt-2 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
				>
					<div className="space-y-4">
						<div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
							<p className="font-semibold text-foreground">
								What {negotiation.companyName} asked for
							</p>
							<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
								{negotiation.requestedFields.map((field) => (
									<li key={field}>{field}</li>
								))}
							</ul>
							<p className="border-t border-border pt-3 leading-6">
								"{negotiation.companyNote}"
							</p>
						</div>

						<div className="space-y-2 rounded-xl border border-border p-4">
							<p className="font-semibold text-foreground">
								What the ask comes to
							</p>
							<dl className="space-y-1.5 text-muted-foreground">
								{negotiation.requestedPriceReduction !== undefined ? (
									<div className="flex items-baseline justify-between gap-3">
										<dt>Price reduction asked</dt>
										<dd className="font-medium tabular-nums text-foreground">
											{formatRupiah(negotiation.requestedPriceReduction)}
										</dd>
									</div>
								) : null}
								{negotiation.requestedWarrantyYears !== undefined ? (
									<div className="flex items-baseline justify-between gap-3">
										<dt>Warranty asked</dt>
										<dd className="font-medium tabular-nums text-foreground">
											{negotiation.requestedWarrantyYears} years
										</dd>
									</div>
								) : null}
								{negotiation.requestedTimelineMonths !== undefined ? (
									<div className="flex items-baseline justify-between gap-3">
										<dt>Timeline asked</dt>
										<dd className="font-medium tabular-nums text-foreground">
											{negotiation.requestedTimelineMonths} months
										</dd>
									</div>
								) : null}
								<div className="flex items-baseline justify-between gap-3">
									<dt>Revision round</dt>
									<dd className="font-medium tabular-nums text-foreground">
										{negotiation.iterationNumber} of {negotiation.maxIterations}
									</dd>
								</div>
							</dl>
						</div>
					</div>

					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="rev-price" className="text-sm font-semibold">
									Revised Vendor Price (IDR)
								</Label>
								<Input
									id="rev-price"
									type="number"
									value={revisedPrice}
									placeholder="Your revised price"
									onChange={(e) => setRevisedPrice(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="rev-warranty" className="text-sm font-semibold">
									Revised Warranty Period (Years)
								</Label>
								<Input
									id="rev-warranty"
									type="number"
									value={revisedWarranty}
									placeholder="Your revised warranty"
									onChange={(e) => setRevisedWarranty(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="rev-note" className="text-sm font-semibold">
								Vendor Justification Notes
							</Label>
							<textarea
								id="rev-note"
								rows={6}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder="What the revised price and warranty cover, and why they changed"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 border-t border-border pt-4 md:col-span-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
						>
							Submit Revision to Client
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/**
 * The proposal as the client marked it. The marks were drawn in the proposal
 * page's own coordinates, so they land on the same lines here as they did on the
 * client's screen — which is the whole point of sending them.
 */
function MarkedProposalDialog({
	negotiation,
}: {
	negotiation: NegotiationRequest;
}) {
	const [open, setOpen] = useState(false);

	const proposalQuery = useQuery({
		queryKey: ["vendor", "proposal", negotiation.proposalId],
		enabled: open,
		queryFn: async () =>
			(await api.vendor.proposalDetail(Number(negotiation.proposalId)))
				.proposal,
	});

	const proposal: ProposalDocumentData | null = proposalQuery.data
		? toProposalDocument(proposalQuery.data, negotiation.projectTitle)
		: null;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<FontAwesomeIcon icon={faFileLines} aria-hidden />
					{`See the ${negotiation.annotations.length} mark${
						negotiation.annotations.length === 1 ? "" : "s"
					} on your proposal`}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle className="text-lg">
						Where {negotiation.companyName} marked your proposal
					</DialogTitle>
					<DialogDescription className="text-base">
						Revision {negotiation.iterationNumber}: “{negotiation.companyNote}”
					</DialogDescription>
				</DialogHeader>
				{proposalQuery.isPending ? (
					<ShimmerBlock className="h-72 w-full rounded-xl" />
				) : proposal === null ? (
					<p className="text-sm text-muted-foreground">
						This proposal could not be read back.
					</p>
				) : (
					<AnnotatedProposal
						proposal={proposal}
						marks={negotiation.annotations}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

/** The vendor's own bid, as the document the client marked. */
function toProposalDocument(
	detail: ProposalDetail,
	fallbackTitle: string,
): ProposalDocumentData {
	return {
		title: detail.project?.title ?? detail.projectTitle ?? fallbackTitle,
		vendorName: detail.vendorCompanyName ?? "Your firm",
		submittedAt: detail.submittedAt,
		amount: detail.amount,
		operationalCost: detail.operationalCost,
		projectedRoi: detail.projectedRoi,
		warrantyPeriod: detail.warrantyPeriod,
		technicalSpec: detail.technicalSpec,
		revisionCount: detail.revisionCount,
	};
}

export function NegotiationCard({
	negotiation,
	onSubmitResponse,
}: NegotiationCardProps) {
	const status = STATUS_META[negotiation.status];
	/* The round is the vendor's to answer only while it is open and inside the
	   limit. An answered round waits on the client, and an agreed or locked one
	   is closed: a response control on any of those could only be refused. */
	const awaitingVendor =
		negotiation.status === "PENDING_VENDOR_RESPONSE" &&
		negotiation.iterationNumber <= negotiation.maxIterations;
	const closedByLimit = negotiation.iterationNumber > negotiation.maxIterations;
	const lapsed = negotiation.status === "LOCKED" || closedByLimit;

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<Badge variant="secondary">
							Iteration {negotiation.iterationNumber} of{" "}
							{negotiation.maxIterations}
						</Badge>
						<Badge variant="outline" className={status.className}>
							{status.label}
						</Badge>
					</div>
					<CardTitle className="mt-2 text-lg">
						{negotiation.projectTitle}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Client: {negotiation.companyName}
					</p>
				</div>
				{/* Nothing left to answer, so the control is not rendered at all and
				    the card body says why. */}
				{awaitingVendor ? (
					<RespondNegotiationDialog
						negotiation={negotiation}
						onSubmitResponse={onSubmitResponse}
					/>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{lapsed ? (
					<div className="flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-50 p-3 text-amber-700">
						<FontAwesomeIcon icon={faLock} />
						{closedByLimit
							? `This negotiation reached the maximum of ${negotiation.maxIterations} revisions and is now locked.`
							: "This negotiation is closed: the tender it belonged to has been decided."}
					</div>
				) : null}

				<div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
					<p className="font-semibold text-foreground">
						Client Requested Revision Items
					</p>
					<div className="flex flex-wrap gap-2">
						{negotiation.requestedFields.map((field) => (
							<Badge key={field} variant="secondary">
								{field}
							</Badge>
						))}
					</div>
					<p className="italic text-muted-foreground">
						"{negotiation.companyNote}"
					</p>
					{negotiation.annotations.length > 0 ? (
						<div className="pt-1">
							<MarkedProposalDialog negotiation={negotiation} />
						</div>
					) : null}
				</div>

				{negotiation.vendorResponseNote && (
					<div className="space-y-1 rounded-lg border border-border p-3">
						<p className="font-semibold text-foreground">
							Latest Vendor Response
						</p>
						<p className="text-muted-foreground">
							{negotiation.vendorResponseNote}
						</p>
						{negotiation.vendorRevisedPrice && (
							<p className="pt-1 font-semibold text-emerald-700">
								Revised Price: {formatRupiah(negotiation.vendorRevisedPrice)} (
								{negotiation.vendorRevisedWarrantyYears}-year warranty)
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
