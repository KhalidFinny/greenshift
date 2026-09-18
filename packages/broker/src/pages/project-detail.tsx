import {
	faArrowLeft,
	faBuilding,
	faEye,
	faFileAlt,
	faFileContract,
	faMapMarkerAlt,
	faPlus,
	faShieldAlt,
	faTruck,
} from "@fortawesome/free-solid-svg-icons";
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
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { DocumentCategory } from "../lib/types";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

{
	/* Modal Create Document Request to Company */
}
function CreateDocumentRequestModal({
	projectId,
	companyName,
	onCreateRequest,
}: {
	projectId: string;
	companyName: string;
	onCreateRequest: (
		projectId: string,
		category: DocumentCategory,
		documentTypeName: string,
		reason: string,
		deadlineDate: string,
		requiredPeriod?: string,
		additionalNotes?: string,
	) => void;
}) {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<DocumentCategory>("Financial");
	const [typeName, setTypeName] = useState("Audited Financial Statements");
	const [period, setPeriod] = useState("2025");
	const [reason, setReason] = useState(
		"Required for solvency ratio analysis and bond underwriting review.",
	);
	const [deadline, setDeadline] = useState("2026-09-20");
	const [notes] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!typeName.trim() || !reason.trim()) return;

		onCreateRequest(
			projectId,
			category,
			typeName,
			reason,
			deadline,
			period,
			notes,
		);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-1.5 text-xs"
				>
					<FontAwesomeIcon icon={faPlus} />
					Request Document
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faFileAlt} className="text-emerald-600" />
						Request Document from Client Company
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">
							Target Client: {companyName}
						</p>
						<p className="text-muted-foreground mt-0.5">
							* In accordance with broker role boundaries, Brokers only request
							documents from the Client Company. If contractor/vendor data is
							required, the Company coordinates it.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="req-cat" className="text-xs font-semibold">
								Document Category:
							</Label>
							<select
								id="req-cat"
								className="w-full rounded-md border border-input bg-background p-2 text-xs"
								value={category}
								onChange={(e) =>
									setCategory(e.target.value as DocumentCategory)
								}
							>
								<option value="Financial">Financial</option>
								<option value="Legal">Legal</option>
								<option value="Project">Project Plan</option>
								<option value="Technical">Technical Specifications</option>
								<option value="Other">Other / Custom</option>
							</select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="req-type" className="text-xs font-semibold">
								Document Type Name:
							</Label>
							<Input
								id="req-type"
								value={typeName}
								onChange={(e) => setTypeName(e.target.value)}
								placeholder="e.g. 2025 Audited Financial Statements"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="req-period" className="text-xs font-semibold">
								Document Period (Optional):
							</Label>
							<Input
								id="req-period"
								value={period}
								onChange={(e) => setPeriod(e.target.value)}
								placeholder="e.g. 2025 (Full Year)"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="req-deadline" className="text-xs font-semibold">
								Submission Deadline:
							</Label>
							<Input
								id="req-deadline"
								type="date"
								value={deadline}
								onChange={(e) => setDeadline(e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="req-reason" className="text-xs font-semibold">
							Reason for Request (Bond Purpose):
						</Label>
						<textarea
							id="req-reason"
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Explain why this document is required for green bond issuance..."
							required
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t border-border">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-[#03442C] text-white hover:bg-[#03442C]/90"
						>
							Send Document Request
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function BrokerProjectDetailPage({ projectId }: { projectId?: string }) {
	const {
		projects,
		documentRequests,
		createDocumentRequest,
		approveDocument,
		rejectDocument,
		updateBondStatus,
	} = useBrokerData();

	const project = projects.find((p) => p.id === projectId) ?? projects[0];

	const projectDocs = documentRequests.filter(
		(d) => d.projectId === project.id,
	);

	return (
		<div className="space-y-6">
			{/* Back button */}
			<div className="flex items-center justify-between">
				<Link to="/broker/projects">
					<Button variant="ghost" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faArrowLeft} />
						Back to Assigned Projects
					</Button>
				</Link>

				<Link to="/broker/monthly-reports">
					<Button variant="outline" size="sm" className="gap-2">
						<FontAwesomeIcon icon={faFileAlt} className="text-purple-600" />
						Monthly Reports
					</Button>
				</Link>
			</div>

			{/* Header Banner */}
			<Card className="border-0 bg-[#03442C] text-white">
				<CardContent className="p-6 space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="border-white/30 text-white uppercase text-xs"
							>
								{project.workflowStatus.replace(/_/g, " ")}
							</Badge>
						</div>
						<span className="text-xs text-emerald-200">
							Assigned Date:{" "}
							{new Date(project.assignedAt).toLocaleDateString("en-US", {
								dateStyle: "medium",
							})}
						</span>
					</div>

					<div>
						<h1 className="text-2xl font-bold text-white">{project.title}</h1>
						<p className="mt-1 text-emerald-100/90 text-sm flex flex-wrap items-center gap-3">
							<span className="flex items-center gap-1">
								<FontAwesomeIcon icon={faBuilding} /> {project.companyName}
							</span>
							•
							<span className="flex items-center gap-1">
								<FontAwesomeIcon icon={faTruck} /> Vendor: {project.vendorName}
							</span>
							•
							<span className="flex items-center gap-1">
								<FontAwesomeIcon icon={faMapMarkerAlt} /> {project.location}
							</span>
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4 rounded-xl bg-white/10 p-4 sm:grid-cols-4 text-xs">
						<div>
							<p className="text-emerald-200">Project Contract Value</p>
							<p className="mt-1 text-sm font-bold text-white">
								{formatRupiah(project.projectValue)}
							</p>
						</div>
						<div>
							<p className="text-emerald-200">Bond Target Issuance</p>
							<p className="mt-1 text-sm font-bold text-white">
								{formatRupiah(project.bondInfo.totalAmount)}
							</p>
						</div>
						<div>
							<p className="text-emerald-200">Projected Financial IRR</p>
							<p className="mt-1 text-sm font-bold text-emerald-300">
								{project.financialProjections.irrPercent}% / yr
							</p>
						</div>
						<div>
							<p className="text-emerald-200">External Bond Status</p>
							<p className="mt-1 text-sm font-bold text-white">
								{project.bondInfo.status} ({project.bondInfo.couponRatePercent}%
								Coupon)
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Left 2 Cols: Overview, Risk & Document Requests */}
				<div className="space-y-6 lg:col-span-2">
					{/* Project Overview */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Underwriting Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<p className="text-muted-foreground leading-relaxed">
								{project.description}
							</p>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs rounded-lg bg-muted p-3">
								<div>
									<p className="text-muted-foreground">
										Internal Rate of Return (IRR)
									</p>
									<p className="font-bold text-emerald-600 text-sm mt-0.5">
										{project.financialProjections.irrPercent}%
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">
										Net Present Value (NPV)
									</p>
									<p className="font-bold text-foreground text-sm mt-0.5">
										{formatRupiah(project.financialProjections.npvAmount)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Payback Period</p>
									<p className="font-bold text-foreground text-sm mt-0.5">
										{project.financialProjections.paybackYears} Years
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Read-Only Project Risk Assessment */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon
									icon={faShieldAlt}
									className="text-emerald-600"
								/>
								Project Risk Assessment
							</CardTitle>
							<Badge
								variant="outline"
								className="border-amber-500 text-amber-700 dark:text-amber-300"
							>
								Overall Risk: {project.riskAssessment.overallRiskLevel}
							</Badge>
						</CardHeader>
						<CardContent className="space-y-4 text-xs">
							<p className="text-muted-foreground">
								This risk assessment is derived from GreenShift's official
								project evaluation. Brokers can review this data for bond
								issuance appraisal, but cannot modify these values.
							</p>

							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-lg border border-border p-3">
									<p className="text-muted-foreground">Financial Risk</p>
									<p className="mt-1 font-bold text-emerald-600">
										{project.riskAssessment.financialRisk}
									</p>
								</div>
								<div className="rounded-lg border border-border p-3">
									<p className="text-muted-foreground">Technical Risk</p>
									<p className="mt-1 font-bold text-amber-600">
										{project.riskAssessment.technicalRisk}
									</p>
								</div>
								<div className="rounded-lg border border-border p-3">
									<p className="text-muted-foreground">Implementation Risk</p>
									<p className="mt-1 font-bold text-amber-600">
										{project.riskAssessment.implementationRisk}
									</p>
								</div>
								<div className="rounded-lg border border-border p-3">
									<p className="text-muted-foreground">Environmental Risk</p>
									<p className="mt-1 font-bold text-emerald-600">
										{project.riskAssessment.environmentalRisk}
									</p>
								</div>
							</div>

							<div className="rounded-lg bg-muted p-3 text-muted-foreground">
								💡 <strong>Risk Review Notes:</strong>{" "}
								{project.riskAssessment.notes}
							</div>
						</CardContent>
					</Card>

					{/* Document Requests Workspace for this project */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon
									icon={faFileAlt}
									className="text-emerald-600"
								/>
								Client Documents
							</CardTitle>
							<CreateDocumentRequestModal
								projectId={project.id}
								companyName={project.companyName}
								onCreateRequest={createDocumentRequest}
							/>
						</CardHeader>
						<CardContent className="space-y-4 text-xs">
							{projectDocs.length === 0 ? (
								<p className="text-muted-foreground text-center py-6">
									No document requests for this project yet. Click the button
									above to create a request.
								</p>
							) : (
								<div className="space-y-3">
									{projectDocs.map((doc) => (
										<div
											key={doc.id}
											className="rounded-xl border border-border p-4 space-y-3"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<span className="text-muted-foreground">
													{doc.status === "REQUESTED"
														? "Requested"
														: doc.status === "SUBMITTED"
															? "Submitted"
															: doc.status}
												</span>
												<span className="text-muted-foreground text-[11px]">
													Deadline: {doc.deadlineDate}
												</span>
											</div>
											<div>
												<h4 className="font-bold text-sm text-foreground">
													{doc.documentTypeName}
												</h4>
												<p className="text-muted-foreground mt-0.5">
													Reason: {doc.reason}
												</p>
											</div>

											{/* Submitted File Details */}
											{doc.submittedFileName && (
												<div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40 flex items-center justify-between">
													<span className="font-semibold text-emerald-900 dark:text-emerald-200">
														📄 Uploaded File: {doc.submittedFileName}
													</span>
													<div className="flex items-center gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																window.open(doc.submittedFileUrl, "_blank")
															}
															className="gap-1.5 text-xs"
														>
															<FontAwesomeIcon icon={faEye} />
															View Document
														</Button>
														{doc.status === "SUBMITTED" && (
															<div className="flex items-center gap-2">
																<Button
																	size="sm"
																	onClick={() => approveDocument(doc.id)}
																	className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
																>
																	Approve Document
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		rejectDocument(
																			doc.id,
																			"Document does not cover the requested period.",
																		)
																	}
																	className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
																>
																	Reject
																</Button>
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right 1 Col: Bond Status Tracker */}
				<div className="space-y-6">
					<Card className="sticky top-6">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FontAwesomeIcon
									icon={faFileContract}
									className="text-emerald-600"
								/>
								Underwriting & Funding Status
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-xs">
							<p className="text-muted-foreground">
								Bond issuance and placement are executed by the Broker outside
								the GreenShift platform. The status below serves as an external
								milestone tracker.
							</p>

							<div className="rounded-xl bg-muted p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">
										Issuance Status:
									</span>
									<Badge className="bg-[#03442C] text-white uppercase">
										{project.bondInfo.status}
									</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Target Issuance:
									</span>
									<span className="font-bold text-foreground">
										{formatRupiah(project.bondInfo.totalAmount)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Coupon Rate:</span>
									<span className="font-bold text-emerald-600">
										{project.bondInfo.couponRatePercent}% / yr
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Bond Tenor:</span>
									<span className="font-bold text-foreground">
										{project.bondInfo.tenorMonths} Months
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Lead Representative:
									</span>
									<span className="font-semibold text-foreground">
										{project.bondInfo.brokerRepresentative}
									</span>
								</div>
							</div>

							<div className="space-y-2 pt-2 border-t border-border">
								<p className="font-semibold text-foreground">
									Update External Bond Status:
								</p>
								<div className="grid grid-cols-2 gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => updateBondStatus(project.id, "IN_PROGRESS")}
									>
										In Progress
									</Button>
									<Button
										size="sm"
										onClick={() => updateBondStatus(project.id, "ISSUED")}
										className="bg-[#03442C] text-white hover:bg-[#03442C]/90"
									>
										Mark as Issued
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
