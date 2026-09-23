import {
	faBuilding,
	faFileAlt,
	faInfoCircle,
	faMapMarkerAlt,
	faSearch,
	faTimesCircle,
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	usePagedRows,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BOND_STATUS_META } from "../lib/labels";
import { workflowLabel } from "../lib/lifecycle";
import type { BrokerAssignedProject } from "../lib/types";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

/** Decline an assignment: a reason is mandatory (§5). */
function DeclineAssignmentModal({
	project,
	onDecline,
}: {
	project: BrokerAssignedProject;
	onDecline: (projectId: string, reason: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reason.trim()) return;
		onDecline(project.id, reason);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className="text-red-700 border-red-200 hover:bg-red-50 text-sm"
				>
					Decline Assignment
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-700">
						<FontAwesomeIcon icon={faTimesCircle} />
						Decline Project Assignment
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">{project.title}</p>
						<p className="text-muted-foreground mt-0.5">
							Client: {project.companyName}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="decline-reason" className="text-sm font-semibold">
							Reason for Declining Assignment (Required):
						</Label>
						<textarea
							id="decline-reason"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Explain the financial or operational reason for declining..."
							required
						/>
					</div>

					<p className="text-sm text-muted-foreground italic">
						* Declining an assignment does not cancel the project. The client
						company will be notified to select another underwriting broker.
					</p>

					<div className="flex justify-end gap-2 pt-2 border-t border-border">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="destructive">
							Confirm Decline Assignment
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/** Ask the company for information before deciding on the assignment (§21). */
function RequestInformationModal({
	project,
	onRequest,
}: {
	project: BrokerAssignedProject;
	onRequest: (projectId: string, message: string) => Promise<unknown>;
}) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!message.trim()) return;
		setBusy(true);
		try {
			await onRequest(project.id, message);
			setOpen(false);
		} finally {
			setBusy(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="text-sm gap-1.5">
					<FontAwesomeIcon icon={faInfoCircle} />
					Request Information
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faInfoCircle} className="text-emerald-700" />
						Request Information from the Company
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">{project.title}</p>
						<p className="text-muted-foreground mt-0.5">
							Client: {project.companyName}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="info-message" className="text-sm font-semibold">
							Information required before deciding:
						</Label>
						<textarea
							id="info-message"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Describe the information or documents you need..."
							required
						/>
					</div>

					{project.informationRequest && (
						<p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
							Already requested: {project.informationRequest}
						</p>
					)}

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
							disabled={busy}
							className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
						>
							Send Request
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/** One assignment card: the financing facts the broker needs to decide (§11). */
function AssignedProjectCard({
	project,
	onAccept,
	onDecline,
	onRequestInformation,
}: {
	project: BrokerAssignedProject;
	onAccept: (projectId: string) => void;
	onDecline: (projectId: string, reason: string) => void;
	onRequestInformation: (
		projectId: string,
		message: string,
	) => Promise<unknown>;
}) {
	const pending = !project.isAccepted && !project.declineReason;

	return (
		<Card className="flex flex-col justify-between">
			<CardHeader className="space-y-3 pb-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge className="bg-[#00712D] text-white">
						{workflowLabel(project.workflowStatus)}
					</Badge>
					<Badge
						variant="outline"
						className={
							project.lvvGrkStatus === "VERIFIED"
								? "border-emerald-700 text-emerald-700"
								: "border-amber-500 text-amber-700"
						}
					>
						{project.lvvGrkStatus === "VERIFIED"
							? "LVV GRK Verified"
							: "LVV GRK Pending"}
					</Badge>
					{project.outstandingRequestsCount > 0 && (
						<Badge className="bg-amber-700 text-white">
							{project.outstandingRequestsCount} open request
							{project.outstandingRequestsCount === 1 ? "" : "s"}
						</Badge>
					)}
				</div>
				<CardTitle className="text-base line-clamp-2">
					{project.title}
				</CardTitle>
				<p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
					<FontAwesomeIcon icon={faBuilding} />
					{project.companyName}
				</p>
				<p className="text-sm text-muted-foreground flex items-center gap-1.5">
					<FontAwesomeIcon icon={faTruck} />
					{project.vendorName || "Vendor not recorded"}
				</p>
			</CardHeader>

			<CardContent className="space-y-4 text-sm">
				<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5">
					<div>
						<p className="text-muted-foreground">Project Value</p>
						<p className="font-semibold text-foreground mt-0.5">
							{formatRupiah(project.projectValue)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Bond Target</p>
						<p className="font-semibold text-emerald-700 mt-0.5">
							{formatRupiah(project.bondInfo.totalAmount)}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between text-muted-foreground">
					<span className="flex items-center gap-1">
						<FontAwesomeIcon icon={faMapMarkerAlt} />
						{project.location || "Location not recorded"}
					</span>
					<span>
						Risk:{" "}
						<strong className="text-foreground">
							{project.riskAssessment.overallRiskLevel}
						</strong>
					</span>
				</div>

				<div className="flex items-center justify-between text-muted-foreground">
					<span>
						Bond:{" "}
						<strong className="text-foreground">
							{BOND_STATUS_META[project.bondInfo.status].label}
						</strong>
					</span>
					<span className="flex items-center gap-1">
						<FontAwesomeIcon icon={faFileAlt} className="text-purple-600" />
						{project.lastReportDate
							? `Report: ${project.lastReportDate}`
							: "No report yet"}
					</span>
				</div>

				{project.milestones.length > 0 && (
					<div className="rounded-lg border border-border p-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Implementation</span>
							<span className="font-semibold text-foreground">
								{Math.round(
									project.milestones.reduce(
										(sum, milestone) => sum + milestone.completionPercent,
										0,
									) / project.milestones.length,
								)}
								%
							</span>
						</div>
						<p className="mt-1 text-muted-foreground">
							{
								project.milestones.filter(
									(milestone) => milestone.status === "APPROVED",
								).length
							}
							/{project.milestones.length} milestones approved
						</p>
					</div>
				)}

				{pending ? (
					<div className="space-y-2 pt-2 border-t border-border">
						<div className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
							New assignment pending confirmation.
						</div>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<DeclineAssignmentModal project={project} onDecline={onDecline} />
							<div className="flex flex-wrap items-center gap-2">
								<RequestInformationModal
									project={project}
									onRequest={onRequestInformation}
								/>
								<Button
									size="sm"
									onClick={() => onAccept(project.id)}
									className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
								>
									Accept Assignment
								</Button>
							</div>
						</div>
					</div>
				) : project.declineReason ? (
					<div className="rounded-lg bg-red-50 p-2.5 text-sm text-red-900 space-y-1 pt-2 border-t border-border">
						<p className="font-bold">Assignment Declined by Broker:</p>
						<p className="italic">"{project.declineReason}"</p>
					</div>
				) : (
					<div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
						<Link to="/broker/projects/$id" params={{ id: project.id }}>
							<Button
								size="sm"
								className="w-full bg-[#00712D] text-white hover:bg-[#00712D]/90"
							>
								Project Detail
							</Button>
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/** One stage's assignment grid: hook pages the tab's filtered rows, control under it. */
function PagedProjectGrid({
	items,
	viewLabel,
	searchQuery,
	onAccept,
	onDecline,
	onRequestInformation,
}: {
	items: BrokerAssignedProject[];
	viewLabel: string;
	searchQuery: string;
	onAccept: (projectId: string) => void;
	onDecline: (projectId: string, reason: string) => void;
	onRequestInformation: (
		projectId: string,
		message: string,
	) => Promise<unknown>;
}) {
	const {
		pageRows,
		pageIndex,
		pageSize,
		pageCount,
		total,
		setPageIndex,
		setPageSize,
	} = usePagedRows(items);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={<FontAwesomeIcon icon={faFileAlt} />}
				title={`No projects ${viewLabel}`}
				description={
					searchQuery
						? `No project matches "${searchQuery}" in this view. Clear the search to see every assignment.`
						: "Client companies allocate verified green projects to your brokerage. An assignment appears here as soon as it is allocated."
				}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{pageRows.map((project) => (
					<AssignedProjectCard
						key={project.id}
						project={project}
						onAccept={onAccept}
						onDecline={onDecline}
						onRequestInformation={onRequestInformation}
					/>
				))}
			</div>
			<PaginationBar
				label="Assigned projects"
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				total={total}
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}

export function BrokerAssignedProjectsPage() {
	const {
		projects,
		isLoading,
		isError,
		refetch,
		acceptAssignment,
		declineAssignment,
		requestInformation,
	} = useBrokerData();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredProjects = projects.filter(
		(project) =>
			project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			project.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			project.vendorName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const inStage = (...stages: BrokerAssignedProject["workflowStatus"][]) =>
		filteredProjects.filter((project) =>
			stages.includes(project.workflowStatus),
		);

	const collection = inStage("ASSIGNED", "DECLINED", "DOCUMENT_COLLECTION");
	const review = inStage("UNDER_REVIEW");
	const bond = inStage("READY_FOR_BOND_ISSUANCE", "BOND_ISSUANCE");
	const monitoring = inStage("MONITORING", "COMPLETED");

	if (isError) {
		return (
			<EmptyState
				tone="error"
				title="Assigned projects did not load"
				description="GET /api/broker/projects did not answer, so no assignment allocated to your brokerage could be read."
				action={
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="relative w-full sm:max-w-md">
				<FontAwesomeIcon
					icon={faSearch}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
				/>
				<Input
					placeholder="Search by project name, client company, or vendor..."
					className="pl-9"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, index) => (
						<ShimmerBlock key={index} className="h-80 w-full" />
					))}
				</div>
			) : (
				<Tabs defaultValue="all">
					<TabsList className="flex w-full overflow-x-auto *:shrink-0 *:whitespace-nowrap sm:grid sm:grid-cols-5">
						<TabsTrigger value="all">
							All ({filteredProjects.length})
						</TabsTrigger>
						<TabsTrigger value="collection">
							Assignment ({collection.length})
						</TabsTrigger>
						<TabsTrigger value="under_review">
							Review ({review.length})
						</TabsTrigger>
						<TabsTrigger value="bond_issuance">
							Bond ({bond.length})
						</TabsTrigger>
						<TabsTrigger value="monitoring">
							Monitoring ({monitoring.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="all" className="mt-6">
						<PagedProjectGrid
							items={filteredProjects}
							viewLabel="assigned to you"
							searchQuery={searchQuery}
							onAccept={acceptAssignment}
							onDecline={declineAssignment}
							onRequestInformation={requestInformation}
						/>
					</TabsContent>
					<TabsContent value="collection" className="mt-6">
						<PagedProjectGrid
							items={collection}
							viewLabel="in the assignment stage"
							searchQuery={searchQuery}
							onAccept={acceptAssignment}
							onDecline={declineAssignment}
							onRequestInformation={requestInformation}
						/>
					</TabsContent>
					<TabsContent value="under_review" className="mt-6">
						<PagedProjectGrid
							items={review}
							viewLabel="in the review stage"
							searchQuery={searchQuery}
							onAccept={acceptAssignment}
							onDecline={declineAssignment}
							onRequestInformation={requestInformation}
						/>
					</TabsContent>
					<TabsContent value="bond_issuance" className="mt-6">
						<PagedProjectGrid
							items={bond}
							viewLabel="in bond issuance"
							searchQuery={searchQuery}
							onAccept={acceptAssignment}
							onDecline={declineAssignment}
							onRequestInformation={requestInformation}
						/>
					</TabsContent>
					<TabsContent value="monitoring" className="mt-6">
						<PagedProjectGrid
							items={monitoring}
							viewLabel="under monitoring"
							searchQuery={searchQuery}
							onAccept={acceptAssignment}
							onDecline={declineAssignment}
							onRequestInformation={requestInformation}
						/>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
