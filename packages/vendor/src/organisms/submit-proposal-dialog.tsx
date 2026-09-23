import {
	faFilePdf,
	faFileShield,
	faGavel,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useAppForm,
} from "@greenshift/ui";
import { useRef, useState } from "react";
import { formatRupiah, formatShortDate } from "../lib/format";
import type { VendorProjectCardData } from "../lib/types";

/** The vendor's own bid on this tender, or null when it has not bid yet. */
export interface MyProposal {
	id: number;
	amount: number;
	/** The PDF already filed on this bid, if any. */
	documentName: string | null;
	documentUrl: string | null;
}

/** The API's own limit, so the picker cannot promise more than it accepts. */
const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface SubmitProposalDialogProps {
	project: VendorProjectCardData;
	/** A bid already on file switches the dialog into revise mode. */
	myProposal: MyProposal | null;
	onSubmit: (
		data: {
			tenderId: number;
			amount: number;
			technicalSpec?: string;
			operationalCost?: number;
			warrantyPeriod?: number;
		},
		file: File,
	) => Promise<unknown>;
	onRevise: (
		data: { proposalId: number; amount: number },
		file: File | null,
	) => Promise<unknown>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** Opens the blueprint over this dialog, so a bidder checks the case without losing the draft. */
	onViewBlueprint: () => void;
}

function formatNumber(value: string): string {
	if (!value) return "";
	const num = value.replace(/\D/g, "");
	if (!num) return "";
	return Number(num).toLocaleString("id-ID");
}

const TEXTAREA_CLASS =
	"w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** The one place a bid is placed or revised: placing and revising are the same act on the same tender, so one dialog serves both.
 * The API's duplicate rule never has to answer a second submission. */
export function SubmitProposalDialog({
	project,
	myProposal,
	onSubmit,
	onRevise,
	isOpen,
	onOpenChange,
	onViewBlueprint,
}: SubmitProposalDialogProps) {
	const revising = myProposal !== null;
	const deadlinePassed =
		project.tenderDeadlineAt !== "" &&
		new Date(project.tenderDeadlineAt).getTime() <= Date.now();

	/* The PDF is held outside the form: a file is not a field, and the upload is a second request
	   against the proposal's id, sent after the bid itself lands. */
	const [file, setFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	function chooseFile(chosen: File | undefined) {
		if (!chosen) return;
		if (chosen.type !== "application/pdf" && !/\.pdf$/i.test(chosen.name)) {
			setFileError("The proposal document must be a PDF.");
			return;
		}
		if (chosen.size > MAX_PDF_BYTES) {
			setFileError("The PDF must be 10 MB or smaller.");
			return;
		}
		setFileError(null);
		setFile(chosen);
	}

	function removeFile() {
		setFile(null);
		setFileError(null);
		// Clearing the input lets the same file be chosen again after removal.
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	const form = useAppForm({
		defaultValues: {
			amount: myProposal ? String(myProposal.amount) : "",
			operationalCost: "",
			warrantyPeriod: "2",
			technicalSpec: "",
		},
		onSubmit: async ({ value }) => {
			const amount = Number(value.amount.replace(/\D/g, ""));
			if (!Number.isFinite(amount) || amount <= 0) return;

			// The revise path carries the amount alone, since that is what a live open-bid ranking is
			// ranked on; the filed document stays unless a replacement is chosen.
			if (myProposal) {
				await onRevise({ proposalId: myProposal.id, amount }, file);
				onOpenChange(false);
				return;
			}

			// A bid is filed with the case for it: the request that creates the bid carries the PDF, so the document is required.
			if (!file) {
				setFileError("Attach the proposal PDF. A bid is filed with it.");
				return;
			}
			if (project.tenderId === null) return;
			await onSubmit(
				{
					tenderId: project.tenderId,
					amount,
					technicalSpec: value.technicalSpec.trim() || undefined,
					operationalCost: value.operationalCost
						? Number(value.operationalCost.replace(/\D/g, ""))
						: undefined,
					warrantyPeriod: Number(value.warrantyPeriod),
				},
				file,
			);
			onOpenChange(false);
		},
	});

	/* The shared client raises the failure as a toast; the dialog stays open on it, so a rejected bid is retried here. */
	const submissionError = form.state.errorMap.onSubmit;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-lg gap-0 p-0 max-h-[90vh] overflow-y-auto">
				<DialogHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-border px-6 pt-6 pr-12 pb-4">
					<DialogTitle className="flex items-center gap-2 text-xl font-semibold">
						<FontAwesomeIcon icon={faGavel} className="text-primary" />
						{revising
							? "Revise Your Bid"
							: project.procurementMethod === "OPEN_BIDDING"
								? "Submit Your Bid"
								: "Submit Proposal"}
					</DialogTitle>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shrink-0 gap-2"
						onClick={onViewBlueprint}
					>
						<FontAwesomeIcon icon={faFileShield} aria-hidden />
						View Blueprint
					</Button>
				</DialogHeader>

				<div className="px-6 pt-5 pb-6">
					<div className="mb-5 space-y-1 rounded-lg bg-muted p-4">
						<p className="text-sm font-semibold text-foreground">
							{project.title}
						</p>
						<p className="text-sm text-muted-foreground">
							Client budget {formatRupiah(project.estimatedValue)}
						</p>
						<p className="text-sm text-muted-foreground">
							{deadlinePassed
								? `Bidding closed ${formatShortDate(project.tenderDeadlineAt)}`
								: `Closes ${formatShortDate(project.tenderDeadlineAt)}`}
						</p>
					</div>

					{deadlinePassed ? (
						<p className="text-sm text-muted-foreground">
							This tender's bidding window has passed, so no bid can be filed on
							it.
						</p>
					) : project.tenderId === null ? (
						<p className="text-sm text-muted-foreground">
							This project has no tender open for bids yet.
						</p>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void form.handleSubmit();
							}}
							className="space-y-4"
							noValidate
						>
							<form.AppField
								name="amount"
								validators={{
									onChange: ({ value }) =>
										value.replace(/\D/g, "") ? undefined : "Required",
								}}
							>
								{(field) => {
									const raw = field.state.value?.replace(/\D/g, "") ?? "";
									const pct =
										raw && project.estimatedValue > 0
											? ((Number(raw) / project.estimatedValue) * 100).toFixed(
													1,
												)
											: null;
									return (
										<div className="space-y-1.5">
											<Label htmlFor="amount" className="text-sm">
												{revising
													? "New Bid Price (IDR) *"
													: "Your Bid Price (IDR) *"}
											</Label>
											<Input
												id="amount"
												type="text"
												inputMode="numeric"
												placeholder="850.000.000"
												className="h-11"
												value={
													field.state.value
														? formatNumber(field.state.value)
														: ""
												}
												onChange={(e) =>
													field.handleChange(e.target.value.replace(/\D/g, ""))
												}
											/>
											{pct ? (
												<p className="text-sm text-muted-foreground">
													{pct}% of client budget
												</p>
											) : null}
										</div>
									);
								}}
							</form.AppField>

							{revising ? (
								<p className="text-sm text-muted-foreground">
									A live open-bid ranking follows the amount, so the revised
									price is what the standings show.
								</p>
							) : (
								<>
									<form.AppField name="operationalCost">
										{(field) => (
											<div className="space-y-1.5">
												<Label htmlFor="op-cost" className="text-sm">
													Operational Cost (IDR)
												</Label>
												<Input
													id="op-cost"
													type="text"
													inputMode="numeric"
													placeholder="0"
													className="h-11"
													value={
														field.state.value
															? formatNumber(field.state.value)
															: ""
													}
													onChange={(e) =>
														field.handleChange(
															e.target.value.replace(/\D/g, ""),
														)
													}
												/>
											</div>
										)}
									</form.AppField>

									<form.AppField name="warrantyPeriod">
										{(field) => (
											<div className="space-y-1.5">
												<Label htmlFor="warranty" className="text-sm">
													Warranty Period (Years)
												</Label>
												<Select
													value={field.state.value}
													onValueChange={(v) => field.handleChange(v)}
												>
													<SelectTrigger id="warranty" className="h-11">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="1">1 Year</SelectItem>
														<SelectItem value="2">2 Years</SelectItem>
														<SelectItem value="3">3 Years</SelectItem>
														<SelectItem value="5">5 Years</SelectItem>
													</SelectContent>
												</Select>
											</div>
										)}
									</form.AppField>

									<form.AppField name="technicalSpec">
										{(field) => (
											<div className="space-y-1.5">
												<Label htmlFor="tech-spec" className="text-sm">
													Technical Approach
												</Label>
												<p className="text-sm text-muted-foreground">
													How the requirements above are met: equipment,
													execution, and the verification method.
												</p>
												<textarea
													id="tech-spec"
													rows={4}
													className={TEXTAREA_CLASS}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											</div>
										)}
									</form.AppField>
								</>
							)}

							{submissionError ? (
								<p role="alert" className="text-sm text-destructive">
									{typeof submissionError === "string"
										? submissionError
										: "The bid was not filed. Try again."}
								</p>
							) : null}

							{/* One input for both states, so the picker keeps a single accessible name: the label is
							    what a pointer sees, the input what the keyboard reaches. */}
							<div className="space-y-2 border-t border-border pt-4">
								<Label htmlFor="proposal-pdf" className="text-sm">
									{revising
										? "Proposal Document (PDF)"
										: "Proposal Document (PDF) *"}
								</Label>
								<p className="text-sm text-muted-foreground">
									The written proposal the client reads beside your price: the
									scope, the equipment, and the schedule.
									{revising
										? " The filed document stays unless you replace it. Up to 10 MB."
										: " Required, up to 10 MB."}
								</p>
								<input
									ref={fileInputRef}
									id="proposal-pdf"
									type="file"
									accept="application/pdf,.pdf"
									className="sr-only"
									onChange={(event) => chooseFile(event.target.files?.[0])}
								/>
								{file ? (
									<div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
										<span className="flex min-w-0 items-center gap-2">
											<FontAwesomeIcon
												icon={faFilePdf}
												className="shrink-0 text-destructive"
												aria-hidden
											/>
											<span className="truncate text-sm font-medium">
												{file.name}
											</span>
										</span>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label={`Remove ${file.name}`}
											onClick={removeFile}
										>
											<FontAwesomeIcon icon={faTrash} aria-hidden />
										</Button>
									</div>
								) : (
									<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => fileInputRef.current?.click()}
										>
											<FontAwesomeIcon icon={faFilePdf} aria-hidden />
											{revising && myProposal?.documentName
												? "Replace the filed PDF"
												: "Choose a PDF"}
										</Button>
										{revising && myProposal?.documentName ? (
											<p className="min-w-0 text-sm text-muted-foreground">
												Filed:{" "}
												{myProposal.documentUrl ? (
													<a
														href={myProposal.documentUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-medium text-blue-700 hover:underline"
													>
														{myProposal.documentName}
													</a>
												) : (
													<span className="font-medium">
														{myProposal.documentName}
													</span>
												)}
											</p>
										) : null}
									</div>
								)}
								{fileError ? (
									<p role="alert" className="text-sm text-destructive">
										{fileError}
									</p>
								) : null}
							</div>

							<div className="flex gap-3 pt-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
								<form.AppForm>
									<form.SubmitButton className="flex-1 bg-[#00712D] font-semibold text-white hover:bg-[#00712D]/90">
										{revising ? "Submit Revised Bid" : "Submit Proposal"}
									</form.SubmitButton>
								</form.AppForm>
							</div>
						</form>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
