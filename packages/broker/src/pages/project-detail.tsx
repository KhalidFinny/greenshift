import {
	faBuilding,
	faExclamationTriangle,
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
	EmptyState,
	Input,
	Label,
	PaginationBar,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
	BOND_STATUS_META,
	DOCUMENT_REQUEST_STATUS_META,
	REPORT_STATUS_META,
	RISK_LEVEL_CLASS,
} from "../lib/labels";
import { nextWorkflowStatuses, workflowLabel } from "../lib/lifecycle";
import type {
	BrokerProjectWorkflowStatus,
	DocumentCategory,
} from "../lib/types";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
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
					className="gap-1.5 bg-[#00712D] text-white hover:bg-[#00712D]/90"
				>
					<FontAwesomeIcon icon={faPlus} />
					Request Document
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faFileAlt} className="text-emerald-700" />
						Request Document from Client Company
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
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
							<Label htmlFor="req-cat" className="text-sm font-semibold">
								Document Category:
							</Label>
							<select
								id="req-cat"
								className="w-full rounded-md border border-input bg-background p-2 text-sm"
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
							<Label htmlFor="req-type" className="text-sm font-semibold">
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
							<Label htmlFor="req-period" className="text-sm font-semibold">
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
							<Label htmlFor="req-deadline" className="text-sm font-semibold">
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
						<Label htmlFor="req-reason" className="text-sm font-semibold">
							Reason for Request (Bond Purpose):
						</Label>
						<textarea
							id="req-reason"
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
							className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
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
		monthlyReports,
		isLoading,
		isError,
		refetch,
		createDocumentRequest,
		approveDocument,
		rejectDocument,
		updateBondStatus,
		updateWorkflowStatus,
	} = useBrokerData();

	// The route param is the source of truth when the page is mounted as a
	// route; the prop stays supported for direct embedding.
	const { id } = useParams({ strict: false }) as { id?: string };
	const targetId = projectId ?? id;
	const project = targetId
		? projects.find((p) => p.id === targetId)
		: projects[0];

	// These hooks page the rows the cards already filtered; they run before the
	// not-found return so the hook order stays fixed.
	const projectDocs = project
		? documentRequests.filter((d) => d.projectId === project.id)
		: [];
	const projectDocumentsPage = usePagedRows(project?.documents ?? []);
	const projectDocsPage = usePagedRows(projectDocs);

	// The assignment list arrives asynchronously; without a project there is
	// nothing to render yet (or the id is not assigned to this broker).
	if (!project) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link to="/broker/projects">
						<Button variant="outline" className="cursor-pointer font-medium">
							Back to Assigned Projects
						</Button>
					</Link>
				</div>
				{isError ? (
					<EmptyState
						tone="error"
						title="The assigned project did not load"
						description="GET /api/broker/projects did not answer, so this assignment could not be read."
						action={
							<Button variant="outline" onClick={() => void refetch()}>
								Try again
							</Button>
						}
					/>
				) : isLoading ? (
					<Card>
						<CardContent className="space-y-4">
							<ShimmerBlock className="h-9 w-2/3" />
							<ShimmerBlock className="h-5 w-1/3" />
							<ShimmerBlock className="h-28 w-full" />
						</CardContent>
					</Card>
				) : (
					<EmptyState
						tone="error"
						icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
						title="Project not assigned to you"
						description="No assignment with this id is held by your brokerage. It may have been declined, completed, or reassigned to another underwriting broker."
					/>
				)}
			</div>
		);
	}

	const projectReports = monthlyReports.filter(
		(report) => report.projectId === project.id,
	);
	const latestReport = projectReports[0];
	const nextStatuses = nextWorkflowStatuses(project.workflowStatus);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-4">
				<Link to="/broker/projects">
					<Button variant="outline" className="cursor-pointer font-medium">
						Back to Assigned Projects
					</Button>
				</Link>

				<Link to="/broker/monthly-reports">
					<Button variant="outline" className="cursor-pointer font-medium">
						<FontAwesomeIcon icon={faFileAlt} className="text-emerald-700" />
						Monthly Reports
					</Button>
				</Link>
			</div>

			<div className="space-y-4 rounded-2xl bg-[#03442C] p-8 text-white">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="outline" className="border-white/30 text-white">
							{workflowLabel(project.workflowStatus)}
						</Badge>
					</div>
					<span className="text-sm text-emerald-200">
						Assigned Date:{" "}
						{new Date(project.assignedAt).toLocaleDateString("en-US", {
							dateStyle: "medium",
						})}
					</span>
				</div>

				<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
					<h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
						{project.title}
					</h1>
					<p className="flex flex-wrap items-center gap-3 text-base text-emerald-100/80">
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

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="rounded-xl bg-white/10 p-4">
						<p className="text-sm text-emerald-200">Project Contract Value</p>
						<p className="mt-1 text-lg font-bold text-white">
							{formatRupiah(project.projectValue)}
						</p>
					</div>
					<div className="rounded-xl bg-white/10 p-4">
						<p className="text-sm text-emerald-200">Bond Target Issuance</p>
						<p className="mt-1 text-lg font-bold text-white">
							{formatRupiah(project.bondInfo.totalAmount)}
						</p>
					</div>
					<div className="rounded-xl bg-white/10 p-4">
						<p className="text-sm text-emerald-200">Projected Financial IRR</p>
						<p className="mt-1 text-lg font-bold text-emerald-300">
							{project.financialProjections.irrPercent}% / yr
						</p>
					</div>
					<div className="rounded-xl bg-white/10 p-4">
						<p className="text-sm text-emerald-200">External Bond Status</p>
						<p className="mt-1 text-lg font-bold text-white">
							{BOND_STATUS_META[project.bondInfo.status].label} (
							{project.bondInfo.couponRatePercent}% Coupon)
						</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon
							icon={faFileContract}
							className="text-emerald-700"
						/>
						Bond Preparation Stage
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl bg-muted p-3">
							<p className="text-muted-foreground">Current stage</p>
							<p className="mt-1 font-bold text-foreground">
								{workflowLabel(project.workflowStatus)}
							</p>
						</div>
						<div className="space-y-2 rounded-xl bg-muted p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="text-muted-foreground">Bond tenor</span>
								<span className="font-semibold text-foreground">
									{project.bondInfo.tenorMonths} months
								</span>
							</div>
							<div className="flex items-center justify-between gap-2">
								<span className="text-muted-foreground">
									Lead representative
								</span>
								<span className="font-semibold text-foreground">
									{project.bondInfo.brokerRepresentative}
								</span>
							</div>
						</div>
					</div>

					{nextStatuses.length === 0 ? (
						<p className="text-muted-foreground">
							{project.workflowStatus === "ASSIGNED"
								? "Accept the assignment to start document collection."
								: project.workflowStatus === "DECLINED"
									? "This assignment was declined by the broker."
									: "This assignment has been completed."}
						</p>
					) : (
						<div className="space-y-2">
							<p className="font-semibold text-foreground">
								Move to the next stage:
							</p>
							{nextStatuses.map((status) => (
								<Button
									key={status}
									size="sm"
									variant="outline"
									className="w-full"
									onClick={() =>
										updateWorkflowStatus(
											project.id,
											status as BrokerProjectWorkflowStatus,
										)
									}
								>
									{workflowLabel(status)}
								</Button>
							))}
						</div>
					)}

					<div className="space-y-2 border-t border-border pt-4">
						<p className="font-semibold text-foreground">Record issuance</p>
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
								className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
								onClick={() => updateBondStatus(project.id, "ISSUED")}
							>
								Mark as Issued
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Underwriting Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p className="text-muted-foreground leading-relaxed">
						{project.description}
					</p>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm rounded-lg bg-muted p-3">
						<div>
							<p className="text-muted-foreground">
								Internal Rate of Return (IRR)
							</p>
							<p className="font-bold text-emerald-700 text-sm mt-0.5">
								{project.financialProjections.irrPercent}%
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Net Present Value (NPV)</p>
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

			{latestReport && (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<FontAwesomeIcon icon={faFileAlt} className="text-emerald-700" />
							Latest Monitoring Report ({latestReport.period})
						</CardTitle>
						<Badge
							className={
								REPORT_STATUS_META[latestReport.overallStatus].className
							}
						>
							{REPORT_STATUS_META[latestReport.overallStatus].label}
						</Badge>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div>
								<p className="text-muted-foreground">Progress</p>
								<p className="mt-1 font-bold text-foreground">
									{latestReport.actualProgressPercent}% (plan{" "}
									{latestReport.plannedProgressPercent}%)
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Energy savings</p>
								<p className="mt-1 font-bold text-emerald-700">
									{latestReport.actualEnergySavingsKwh.toLocaleString("en-US")}{" "}
									kWh
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Emission reduction</p>
								<p className="mt-1 font-bold text-emerald-700">
									{latestReport.actualCarbonReductionTons} tCO2e
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Budget variance</p>
								<p className="mt-1 font-bold text-foreground">
									{formatRupiah(
										latestReport.actualSpendingAmount -
											latestReport.plannedBudgetAmount,
									)}
								</p>
							</div>
						</div>
						<p className="text-muted-foreground leading-relaxed">
							{latestReport.overallConclusion}
						</p>
						<Link
							to="/broker/monthly-reports/$id"
							params={{ id: latestReport.id }}
						>
							<Button size="sm" variant="outline" className="gap-1.5 text-sm">
								<FontAwesomeIcon icon={faFileAlt} />
								Open report
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon icon={faShieldAlt} className="text-emerald-700" />
						Project Risk Assessment
					</CardTitle>
					<Badge
						variant="outline"
						className={
							RISK_LEVEL_CLASS[project.riskAssessment.overallRiskLevel].outline
						}
					>
						Overall Risk: {project.riskAssessment.overallRiskLevel}
					</Badge>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p className="text-muted-foreground">
						This risk assessment is derived from GreenShift's official project
						evaluation. Brokers can review this data for bond issuance
						appraisal, but cannot modify these values.
					</p>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-lg border border-border p-3">
							<p className="text-muted-foreground">Financial Risk</p>
							<p
								className={`mt-1 font-bold ${
									RISK_LEVEL_CLASS[project.riskAssessment.financialRisk].text
								}`}
							>
								{project.riskAssessment.financialRisk}
							</p>
						</div>
						<div className="rounded-lg border border-border p-3">
							<p className="text-muted-foreground">Technical Risk</p>
							<p
								className={`mt-1 font-bold ${
									RISK_LEVEL_CLASS[project.riskAssessment.technicalRisk].text
								}`}
							>
								{project.riskAssessment.technicalRisk}
							</p>
						</div>
						<div className="rounded-lg border border-border p-3">
							<p className="text-muted-foreground">Implementation Risk</p>
							<p
								className={`mt-1 font-bold ${
									RISK_LEVEL_CLASS[project.riskAssessment.implementationRisk]
										.text
								}`}
							>
								{project.riskAssessment.implementationRisk}
							</p>
						</div>
						<div className="rounded-lg border border-border p-3">
							<p className="text-muted-foreground">Environmental Risk</p>
							<p
								className={`mt-1 font-bold ${
									RISK_LEVEL_CLASS[project.riskAssessment.environmentalRisk]
										.text
								}`}
							>
								{project.riskAssessment.environmentalRisk}
							</p>
						</div>
					</div>

					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">Risk Review Notes</p>
						<p className="mt-1 text-muted-foreground">
							{project.riskAssessment.notes}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon icon={faEye} className="text-emerald-700" />
						Available Project Documents
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{project.documents.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faEye} />}
							title="No project documents on file"
							description="GreenShift holds no verified documents for this project yet. Documents uploaded during LVV GRK verification will be listed here."
						/>
					) : (
						projectDocumentsPage.pageRows.map((document) => (
							<div
								key={document.id}
								className="flex items-center justify-between rounded-lg border border-border p-3"
							>
								<div>
									<p className="font-semibold text-foreground">
										{document.fileName}
									</p>
									<p className="text-muted-foreground mt-0.5">
										{document.type.replace(/_/g, " ")} - {document.uploadedAt}
									</p>
								</div>
								{document.fileUrl && (
									<Button
										size="sm"
										variant="outline"
										className="text-sm"
										onClick={() =>
											window.open(document.fileUrl ?? "#", "_blank")
										}
									>
										View
									</Button>
								)}
							</div>
						))
					)}
					<PaginationBar
						label="Project documents"
						pageIndex={projectDocumentsPage.pageIndex}
						pageSize={projectDocumentsPage.pageSize}
						pageCount={projectDocumentsPage.pageCount}
						total={projectDocumentsPage.total}
						onPageIndexChange={projectDocumentsPage.setPageIndex}
						onPageSizeChange={projectDocumentsPage.setPageSize}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon icon={faFileAlt} className="text-emerald-700" />
						Client Documents
					</CardTitle>
					<CreateDocumentRequestModal
						projectId={project.id}
						companyName={project.companyName}
						onCreateRequest={createDocumentRequest}
					/>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					{projectDocs.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faFileAlt} />}
							title="No document requests for this project"
							description="Request the financial, legal, or technical files underwriting needs. Use Request Document above to send the first request to the client company."
						/>
					) : (
						<div className="space-y-3">
							{projectDocsPage.pageRows.map((doc) => (
								<div
									key={doc.id}
									className="rounded-xl border border-border p-4 space-y-3"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<Badge
											className={
												DOCUMENT_REQUEST_STATUS_META[doc.status].className
											}
										>
											{DOCUMENT_REQUEST_STATUS_META[doc.status].label}
										</Badge>
										<span className="text-sm text-muted-foreground">
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

									{doc.submittedFileName && (
										<div className="rounded-lg bg-emerald-50 p-3 flex items-center justify-between">
											<span className="flex items-center gap-1.5 font-semibold text-emerald-900">
												<FontAwesomeIcon icon={faFileAlt} />
												Uploaded File: {doc.submittedFileName}
											</span>
											<div className="flex items-center gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														window.open(doc.submittedFileUrl, "_blank")
													}
													className="gap-1.5 text-sm"
												>
													<FontAwesomeIcon icon={faEye} />
													View Document
												</Button>
												{doc.status === "SUBMITTED" && (
													<div className="flex items-center gap-2">
														<Button
															size="sm"
															onClick={() => approveDocument(doc.id)}
															className="bg-emerald-700 text-white hover:bg-emerald-700 text-sm"
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
															className="text-red-700 border-red-200 hover:bg-red-50 text-sm"
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
					<PaginationBar
						label="Client document requests"
						pageIndex={projectDocsPage.pageIndex}
						pageSize={projectDocsPage.pageSize}
						pageCount={projectDocsPage.pageCount}
						total={projectDocsPage.total}
						onPageIndexChange={projectDocsPage.setPageIndex}
						onPageSizeChange={projectDocsPage.setPageSize}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
