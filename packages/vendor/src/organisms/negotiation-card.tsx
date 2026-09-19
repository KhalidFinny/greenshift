import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
} from "@greenshift/ui";
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
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>
						Structured Negotiation Response (Revision{" "}
						{negotiation.iterationNumber} of {negotiation.maxIterations})
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
					<div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
						<p className="font-semibold text-foreground">
							Client Revision Requests ({negotiation.companyName})
						</p>
						<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
							{negotiation.requestedFields.map((field) => (
								<li key={field}>{field}</li>
							))}
						</ul>
						<p className="pt-1 text-sm italic text-muted-foreground">
							"{negotiation.companyNote}"
						</p>
					</div>

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
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="What the revised price and warranty cover, and why they changed"
						/>
					</div>

					<div className="flex justify-end gap-2 border-t border-border pt-2">
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

export function NegotiationCard({
	negotiation,
	onSubmitResponse,
}: NegotiationCardProps) {
	const status = STATUS_META[negotiation.status];
	const isLocked =
		negotiation.status === "LOCKED" ||
		negotiation.iterationNumber > negotiation.maxIterations;

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
				{/* Locked negotiations cannot be answered, so the control is not
				    rendered at all: the reason is stated in the card body instead. */}
				{isLocked ? null : (
					<RespondNegotiationDialog
						negotiation={negotiation}
						onSubmitResponse={onSubmitResponse}
					/>
				)}
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{isLocked ? (
					<div className="flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-50 p-3 text-amber-700">
						<FontAwesomeIcon icon={faLock} />
						This negotiation reached the maximum of {negotiation.maxIterations}{" "}
						revisions and is now locked.
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
