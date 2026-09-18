import {
	faCheckCircle,
	faFileAlt,
	faFilter,
	faPlus,
	faSearch,
	faTimesCircle,
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
	Input,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { useState } from "react";
import type { BrokerDocumentRequest, DocumentCategory } from "../lib/types";
import { useBrokerData } from "../lib/use-broker-data";

{
	/* Modal Reject Document with mandatory reason */
}
function RejectDocumentModal({
	request,
	onReject,
}: {
	request: BrokerDocumentRequest;
	onReject: (requestId: string, reason: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reason.trim()) return;
		onReject(request.id, reason);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
				>
					Reject & Request Revision
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<FontAwesomeIcon icon={faTimesCircle} />
						Reject Document & Request Re-upload
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">
							{request.documentTypeName}
						</p>
						<p className="text-muted-foreground mt-0.5">
							Client: {request.companyName}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="rej-reason" className="text-xs font-semibold">
							Document Rejection Reason (Required):
						</Label>
						<textarea
							id="rej-reason"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="e.g. Uploaded financial statement does not cover full year 2025..."
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
						<Button type="submit" variant="destructive">
							Submit Document Rejection
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

{
	/* Modal Create Document Request */
}
function GlobalCreateDocumentRequestModal({
	projects,
	onCreateRequest,
}: {
	projects: Array<{ id: string; title: string; companyName: string }>;
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
	const [selectedProjectId, setSelectedProjectId] = useState(
		projects[0]?.id ?? "",
	);
	const [category, setCategory] = useState<DocumentCategory>("Financial");
	const [typeName, setTypeName] = useState("");
	const [period, setPeriod] = useState("");
	const [reason, setReason] = useState("");
	const [deadline, setDeadline] = useState("2026-09-20");
	const [notes] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!typeName.trim() || !reason.trim() || !selectedProjectId) return;

		onCreateRequest(
			selectedProjectId,
			category,
			typeName,
			reason,
			deadline,
			period,
			notes,
		);
		setOpen(false);
		setTypeName("");
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-[#03442C] text-white hover:bg-[#03442C]/90 gap-2">
					<FontAwesomeIcon icon={faPlus} />
					Create Document Request
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faFileAlt} className="text-emerald-600" />
						Request Document from Client
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
					<div className="space-y-1.5">
						<Label htmlFor="g-proj" className="text-xs font-semibold">
							Select Assigned Project:
						</Label>
						<select
							id="g-proj"
							className="w-full rounded-md border border-input bg-background p-2 text-xs"
							value={selectedProjectId}
							onChange={(e) => setSelectedProjectId(e.target.value)}
						>
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.title} ({p.companyName})
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="g-cat" className="text-xs font-semibold">
								Document Category:
							</Label>
							<select
								id="g-cat"
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
							<Label htmlFor="g-type" className="text-xs font-semibold">
								Document Type Name:
							</Label>
							<Input
								id="g-type"
								value={typeName}
								onChange={(e) => setTypeName(e.target.value)}
								placeholder="e.g. 2025 Audited Financial Statements"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="g-period" className="text-xs font-semibold">
								Document Period (Optional):
							</Label>
							<Input
								id="g-period"
								value={period}
								onChange={(e) => setPeriod(e.target.value)}
								placeholder="2025 (Full Year)"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="g-deadline" className="text-xs font-semibold">
								Submission Deadline:
							</Label>
							<Input
								id="g-deadline"
								type="date"
								value={deadline}
								onChange={(e) => setDeadline(e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="g-reason" className="text-xs font-semibold">
							Reason for Request (Bond Purpose):
						</Label>
						<textarea
							id="g-reason"
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Explain financial or legal justification for this document..."
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

export function BrokerDocumentRequestsPage() {
	const {
		projects,
		documentRequests,
		createDocumentRequest,
		approveDocument,
		rejectDocument,
	} = useBrokerData();

	const [searchQuery, setSearchQuery] = useState("");

	const filteredRequests = documentRequests.filter(
		(d) =>
			d.documentTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			d.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Document Requests Center</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Request legal, financial, and technical documents from Client
						Companies for bond underwriting requirements.
					</p>
				</div>
				<GlobalCreateDocumentRequestModal
					projects={projects}
					onCreateRequest={createDocumentRequest}
				/>
			</div>

			{/* Search & Filter */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<FontAwesomeIcon
						icon={faSearch}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
					/>
					<Input
						placeholder="Search by document name, company, or project..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button variant="outline" className="gap-2 shrink-0">
					<FontAwesomeIcon icon={faFilter} />
					Filter Category
				</Button>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="all">All ({filteredRequests.length})</TabsTrigger>
					<TabsTrigger value="pending">
						Awaiting Review (
						{
							filteredRequests.filter(
								(d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
							).length
						}
						)
					</TabsTrigger>
					<TabsTrigger value="approved">
						Approved (
						{filteredRequests.filter((d) => d.status === "APPROVED").length})
					</TabsTrigger>
					<TabsTrigger value="requested">
						Awaiting Client (
						{filteredRequests.filter((d) => d.status === "REQUESTED").length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6 space-y-4">
					{filteredRequests.map((doc) => (
						<Card key={doc.id}>
							<CardContent className="p-5 space-y-3 text-xs">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Badge className="bg-blue-600 text-white font-semibold">
											{doc.category}
										</Badge>
										<Badge
											className={
												doc.status === "APPROVED"
													? "bg-emerald-600 text-white"
													: doc.status === "REJECTED"
														? "bg-red-600 text-white"
														: doc.status === "SUBMITTED"
															? "bg-amber-600 text-white"
															: "bg-muted text-muted-foreground"
											}
										>
											Status: {doc.status}
										</Badge>
									</div>
									<span className="text-muted-foreground text-[11px]">
										Deadline: {doc.deadlineDate}
									</span>
								</div>

								<div>
									<h4 className="font-bold text-sm text-foreground">
										{doc.documentTypeName}
									</h4>
									<p className="text-muted-foreground mt-0.5">
										Project: {doc.projectTitle} • Client: {doc.companyName}
									</p>
									<p className="text-muted-foreground mt-1">
										Reason: {doc.reason}
									</p>
								</div>

								{/* Submitted file review section */}
								{doc.submittedFileName && (
									<div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40 flex flex-wrap items-center justify-between gap-3 border border-emerald-200 dark:border-emerald-800">
										<span className="flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-200">
											<FontAwesomeIcon
												icon={faFileAlt}
												className="text-emerald-600 text-sm"
											/>
											File Uploaded: {doc.submittedFileName} ({doc.submittedAt})
										</span>

										{doc.status === "SUBMITTED" && (
											<div className="flex items-center gap-2">
												<RejectDocumentModal
													request={doc}
													onReject={rejectDocument}
												/>
												<Button
													size="sm"
													onClick={() => approveDocument(doc.id)}
													className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1.5"
												>
													<FontAwesomeIcon icon={faCheckCircle} />
													Approve Document
												</Button>
											</div>
										)}
									</div>
								)}

								{doc.rejectionReason && (
									<div className="rounded-lg bg-red-50 p-3 text-red-950 dark:bg-red-950/40 dark:text-red-200 border border-red-200">
										<p className="font-bold">Broker Rejection Reason:</p>
										<p className="mt-0.5">{doc.rejectionReason}</p>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</TabsContent>

				<TabsContent value="pending" className="mt-6 space-y-4">
					{filteredRequests
						.filter(
							(d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
						)
						.map((doc) => (
							<Card key={doc.id}>
								<CardContent className="p-5 space-y-3 text-xs">
									<h4 className="font-bold text-sm">{doc.documentTypeName}</h4>
									<div className="flex items-center justify-between pt-2 border-t border-border">
										<span className="font-semibold text-emerald-700 dark:text-emerald-300">
											📄 {doc.submittedFileName}
										</span>
										<Button
											size="sm"
											onClick={() => approveDocument(doc.id)}
											className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
										>
											Approve Document
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
				</TabsContent>

				<TabsContent value="approved" className="mt-6 space-y-4">
					{filteredRequests
						.filter((d) => d.status === "APPROVED")
						.map((doc) => (
							<Card key={doc.id}>
								<CardContent className="p-5 text-xs space-y-1">
									<Badge className="bg-emerald-600 text-white mb-1">
										Approved
									</Badge>
									<h4 className="font-bold text-sm">{doc.documentTypeName}</h4>
									<p className="text-muted-foreground">
										{doc.submittedFileName}
									</p>
								</CardContent>
							</Card>
						))}
				</TabsContent>

				<TabsContent value="requested" className="mt-6 space-y-4">
					{filteredRequests
						.filter((d) => d.status === "REQUESTED")
						.map((doc) => (
							<Card key={doc.id}>
								<CardContent className="p-5 text-xs space-y-1">
									<Badge variant="outline">Awaiting Client</Badge>
									<h4 className="font-bold text-sm">{doc.documentTypeName}</h4>
									<p className="text-muted-foreground">
										Deadline: {doc.deadlineDate}
									</p>
								</CardContent>
							</Card>
						))}
				</TabsContent>
			</Tabs>
		</div>
	);
}
