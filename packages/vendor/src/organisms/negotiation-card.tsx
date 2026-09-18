import { faCheckCircle, faHandshake, faLock } from "@fortawesome/free-solid-svg-icons";
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
import type { NegotiationRequest } from "../lib/types";
import { formatRupiah } from "../lib/format";

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

function RespondNegotiationDialog({
	negotiation,
	onSubmitResponse,
}: NegotiationCardProps) {
	const [open, setOpen] = useState(false);
	const [revisedPrice, setRevisedPrice] = useState(
		(negotiation.vendorRevisedPrice ?? 8150000000).toString(),
	);
	const [revisedWarranty, setRevisedWarranty] = useState(
		(negotiation.vendorRevisedWarrantyYears ?? 7).toString(),
	);
	const [note, setNote] = useState(
		"We accept the adjusted investment pricing at Rp 8,150,000,000 with a 7-year extended service warranty.",
	);

	const isLocked =
		negotiation.status === "LOCKED" ||
		negotiation.iterationNumber > negotiation.maxIterations;

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
					disabled={isLocked}
					className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{isLocked
						? "Negotiation Locked"
						: `Respond to Revision (${negotiation.iterationNumber}/${negotiation.maxIterations})`}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faHandshake} className="text-blue-600" />
						Structured Negotiation Response (Revision {negotiation.iterationNumber}{" "}
						of {negotiation.maxIterations})
					</DialogTitle>
				</DialogHeader>

				{isLocked ? (
					<div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
						<FontAwesomeIcon icon={faLock} />
						The negotiation process has reached the maximum limit of 3 revisions and is currently locked.
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
						<div className="space-y-2 rounded-lg bg-blue-50/70 p-3 dark:bg-blue-950/40">
							<p className="font-semibold text-blue-900 dark:text-blue-200">
								Client Revision Requests ({negotiation.companyName}):
							</p>
							<div className="space-y-1">
								{negotiation.requestedFields.map((f, idx) => (
									<div
										key={idx}
										className="flex items-center gap-2 text-blue-800 dark:text-blue-300"
									>
										<FontAwesomeIcon
											icon={faCheckCircle}
											className="text-blue-600"
										/>
										<span>{f}</span>
									</div>
								))}
							</div>
							<p className="pt-1 text-[11px] italic text-muted-foreground">
								"{negotiation.companyNote}"
							</p>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label htmlFor="rev-price" className="text-xs font-semibold">
									Revised Vendor Price (IDR):
								</Label>
								<Input
									id="rev-price"
									type="number"
									value={revisedPrice}
									onChange={(e) => setRevisedPrice(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="rev-warranty" className="text-xs font-semibold">
									Revised Warranty Period (Years):
								</Label>
								<Input
									id="rev-warranty"
									type="number"
									value={revisedWarranty}
									onChange={(e) => setRevisedWarranty(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="rev-note" className="text-xs font-semibold">
								Vendor Justification Notes:
							</Label>
							<textarea
								id="rev-note"
								rows={3}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder="Detail your justification for price/warranty revisions..."
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
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								Submit Revision to Client
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

export function NegotiationCard({ negotiation, onSubmitResponse }: NegotiationCardProps) {
	return (
		<Card className="border-blue-200 dark:border-blue-800">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<div className="flex items-center gap-2">
						<Badge className="bg-blue-600 text-white">
							Negotiation Iteration ({negotiation.iterationNumber} /{" "}
							{negotiation.maxIterations})
						</Badge>
						<Badge variant="outline" className="text-xs">
							{negotiation.status.replace(/_/g, " ")}
						</Badge>
					</div>
					<CardTitle className="mt-2 text-lg">{negotiation.projectTitle}</CardTitle>
					<p className="text-xs text-muted-foreground">
						Client: {negotiation.companyName}
					</p>
				</div>
				<RespondNegotiationDialog
					negotiation={negotiation}
					onSubmitResponse={onSubmitResponse}
				/>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<div className="space-y-2 rounded-lg bg-blue-50/60 p-3 dark:bg-blue-950/30">
					<p className="font-semibold text-blue-950 dark:text-blue-200">
						Client Requested Revision Items:
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
							Latest Vendor Response:
						</p>
						<p className="text-muted-foreground">{negotiation.vendorResponseNote}</p>
						{negotiation.vendorRevisedPrice && (
							<p className="pt-1 font-semibold text-emerald-600 dark:text-emerald-400">
								Revised Price: {formatRupiah(negotiation.vendorRevisedPrice)}{" "}
								({negotiation.vendorRevisedWarrantyYears}-year warranty)
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
