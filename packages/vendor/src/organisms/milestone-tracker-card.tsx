import {
	faCamera,
	faClipboardList,
	faCloudUploadAlt,
	faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	EmptyState,
	Input,
	Label,
	ShimmerBlock,
} from "@greenshift/ui";
import { useState } from "react";
import { formatShortDate } from "../lib/format";
import { MILESTONE_STATUS_LABEL } from "../lib/labels";
import type { EvidenceFile, ProjectMilestone } from "../lib/types";

interface MilestoneTrackerCardProps {
	projectId: string;
	milestones: ProjectMilestone[];
	onSubmitEvidence: (
		activeProjectId: string,
		milestoneId: string,
		evidenceItem: EvidenceFile,
		notes: string,
	) => void;
	/** Milestones still in flight: same card frames, shimmering contents. */
	loading?: boolean;
}

function SubmitMilestoneEvidenceDialog({
	projectId,
	milestone,
	onSubmitEvidence,
}: {
	projectId: string;
	milestone: ProjectMilestone;
	onSubmitEvidence: (
		activeProjectId: string,
		milestoneId: string,
		evidenceItem: EvidenceFile,
		notes: string,
	) => void;
}) {
	const [open, setOpen] = useState(false);
	const [fileName, setFileName] = useState("");
	const [fileType, setFileType] = useState<EvidenceFile["type"]>("photo");
	const [vendorNotes, setVendorNotes] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!fileName.trim()) return;

		const newItem: EvidenceFile = {
			id: `ev-${Date.now()}`,
			name: fileName,
			type: fileType,
			url: "#",
			uploadedAt: new Date().toISOString().split("T")[0],
		};

		onSubmitEvidence(projectId, milestone.id, newItem, vendorNotes);
		setOpen(false);
		setFileName("");
		setVendorNotes("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className="gap-1.5 bg-[#00712D] text-sm text-white hover:bg-[#00712D]/90"
				>
					<FontAwesomeIcon icon={faCloudUploadAlt} />
					Upload Milestone Evidence
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faCamera} className="text-emerald-700" />
						Upload Physical Evidence for Milestone 0{milestone.stepNumber}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">{milestone.title}</p>
						<p className="mt-0.5 text-muted-foreground">
							{milestone.description}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="ev-name" className="text-sm font-semibold">
							Evidence File / Document Name:
						</Label>
						<Input
							id="ev-name"
							value={fileName}
							onChange={(e) => setFileName(e.target.value)}
							placeholder="e.g. Inverter_Wiring_Inspection_Photo.jpg"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="ev-type" className="text-sm font-semibold">
							Evidence Type:
						</Label>
						<select
							id="ev-type"
							className="w-full rounded-md border border-input bg-background p-2 text-sm"
							value={fileType}
							onChange={(e) =>
								setFileType(e.target.value as EvidenceFile["type"])
							}
						>
							<option value="photo">Field Photo (Photo)</option>
							<option value="video">Video Documentation</option>
							<option value="document">
								Document / BAST (Handover Certificate)
							</option>
							<option value="inspection">Inspection / Testing Report</option>
							<option value="energy_data">Energy Log / Smart Meter Data</option>
						</select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="ev-notes" className="text-sm font-semibold">
							Vendor Execution Notes:
						</Label>
						<textarea
							id="ev-notes"
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={vendorNotes}
							onChange={(e) => setVendorNotes(e.target.value)}
							placeholder="Detail physical milestones achieved and installation specs..."
						/>
					</div>

					<p className="text-sm italic text-muted-foreground">
						* After uploading evidence, the milestone status advances to "Under
						Review" for client inspection and sign-off.
					</p>

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
							Submit Evidence for Client Review
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function MilestoneTrackerCard({
	projectId,
	milestones,
	onSubmitEvidence,
	loading = false,
}: MilestoneTrackerCardProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold">Agreed Milestones Tracker</h3>
				<span className="text-sm text-muted-foreground">
					* Milestones are jointly scheduled with the Client upon contract
					execution.
				</span>
			</div>

			{loading ? (
				<div className="space-y-4">
					{Array.from({ length: 2 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="space-y-4 p-5">
								<div className="flex items-center gap-2">
									<ShimmerBlock className="h-6 w-28 rounded-md" />
									<ShimmerBlock className="h-5 w-24" />
								</div>
								<ShimmerBlock className="h-5 w-2/3" />
								<ShimmerBlock className="h-4 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : milestones.length === 0 ? (
				<EmptyState
					icon={<FontAwesomeIcon icon={faClipboardList} />}
					title="No milestones scheduled"
					description="Milestones appear here once your team and the client agree the delivery schedule for this project."
				/>
			) : (
				<div className="space-y-4">
					{milestones.map((ms) => {
						const isDone =
							ms.status === "COMPLETED" || ms.status === "APPROVED";
						return (
							<Card
								key={ms.id}
								className={
									isDone ? "border-emerald-500/50 bg-emerald-50/20" : ""
								}
							>
								<CardContent className="space-y-4 p-5 text-sm">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="font-bold">
													Milestone 0{ms.stepNumber}
												</Badge>
												<Badge
													className={
														isDone
															? "bg-emerald-700 text-white"
															: ms.status === "SUBMITTED_FOR_REVIEW"
																? "bg-blue-600 text-white"
																: "bg-muted text-muted-foreground"
													}
												>
													{MILESTONE_STATUS_LABEL[ms.status]}
												</Badge>
											</div>
											<h4 className="mt-1 text-base font-bold text-foreground">
												{ms.title}
											</h4>
											<p className="text-muted-foreground">{ms.description}</p>
										</div>

										{!isDone && (
											<SubmitMilestoneEvidenceDialog
												projectId={projectId}
												milestone={ms}
												onSubmitEvidence={onSubmitEvidence}
											/>
										)}
									</div>

									{/* Evidence List */}
									{ms.evidence.length > 0 && (
										<div className="space-y-2 rounded-lg bg-muted p-3">
											<p className="font-semibold text-foreground">
												Uploaded Execution Evidence:
											</p>
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
												{ms.evidence.map((ev) => (
													<div
														key={ev.id}
														className="flex items-center justify-between rounded-md border border-border bg-card p-2 text-sm"
													>
														<span className="flex items-center gap-2 truncate">
															<FontAwesomeIcon
																icon={faFileAlt}
																className="text-emerald-700"
															/>
															{ev.name}
														</span>
														<span className="text-sm text-muted-foreground">
															{formatShortDate(ev.uploadedAt)}
														</span>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Notes */}
									{ms.companyReviewNotes && (
										<div className="rounded-lg bg-emerald-100/60 p-3 text-emerald-950">
											<p className="font-semibold">Client Review Notes:</p>
											<p className="mt-0.5">{ms.companyReviewNotes}</p>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
