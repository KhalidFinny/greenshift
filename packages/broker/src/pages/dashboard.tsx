import {
	faBell,
	faClock,
	faExclamationTriangle,
	faFileAlt,
	faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	PaginationBar,
	ShimmerBlock,
	usePagedRows,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

import { workflowLabel } from "../lib/lifecycle";
import { useBrokerData } from "../lib/use-broker-data";
import { KpiRow } from "../molecules/kpi-row";
import { BrokerLifecycleCard } from "../organisms/broker-lifecycle-card";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function BrokerDashboard() {
	const {
		verification,
		projects,
		documentRequests,
		notifications,
		metrics,
		isLoading,
		isLoadingDocumentRequests,
		isLoadingNotifications,
		isError,
		refetch,
		approveDocument,
		markNotificationRead,
	} = useBrokerData();

	const isVerified = verification.status === "VERIFIED";
	const pendingDocs = documentRequests.filter(
		(d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
	);
	const pendingDocsPage = usePagedRows(pendingDocs);
	const notificationsPage = usePagedRows(notifications);

	if (isError) {
		return (
			<EmptyState
				tone="error"
				title="Dashboard data did not load"
				description="The broker profile, project, request, report, or notification endpoint did not answer, so the workload figures and the queues below could not be read."
				action={
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	// Labels and icons are static, so they stay real text while the figures load.
	const kpiItems = [
		{
			label: "Assigned Projects",
			value: metrics.assignedProjectsCount,
			sub: "GHG LVV verified projects",
			icon: faLeaf,
			iconBg: "bg-emerald-100",
			iconColor: "text-emerald-700",
		},
		{
			label: "Document Requests",
			value: metrics.outstandingRequestsCount,
			sub: "Awaiting client response",
			icon: faClock,
			iconBg: "bg-amber-100",
			iconColor: "text-amber-700",
		},
		{
			label: "Review Documents",
			value: metrics.awaitingReviewCount,
			sub: "Uploaded by client companies",
			icon: faFileAlt,
			iconBg: "bg-blue-100",
			iconColor: "text-blue-700",
		},
	];

	return (
		<div className="space-y-6">
			{!isVerified && (
				<div className="flex items-start justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
					<div className="flex items-start gap-3">
						<FontAwesomeIcon
							icon={faExclamationTriangle}
							className="mt-0.5 text-xl text-amber-700"
						/>
						<div>
							<h3 className="font-semibold">Broker Verification Required</h3>
							<p className="mt-1 text-sm">
								Your Broker account is not fully verified. You cannot process
								project bond underwriting assignments or approve company
								documents yet.
							</p>
						</div>
					</div>
					<Link to="/broker/settings">
						<Button
							size="sm"
							className="bg-amber-700 text-white hover:bg-amber-700"
						>
							Complete Verification
						</Button>
					</Link>
				</div>
			)}

			<KpiRow items={kpiItems} loading={isLoading} />

			<BrokerLifecycleCard projects={projects} loading={isLoading} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg">
							Verified Assigned Projects
						</CardTitle>
						{isLoading ? null : (
							<Button variant="outline" size="sm" asChild>
								<Link to="/broker/projects">View all projects</Link>
							</Button>
						)}
					</CardHeader>
					<CardContent className="space-y-4">
						{isLoading ? (
							Array.from({ length: 2 }, (_, index) => (
								<ShimmerBlock key={index} className="h-44 w-full" />
							))
						) : projects.length === 0 ? (
							<EmptyState
								icon={<FontAwesomeIcon icon={faLeaf} />}
								title="No assigned projects yet"
								description="Client companies allocate verified green projects to your brokerage. Pending and accepted assignments appear here."
							/>
						) : (
							projects.slice(0, 2).map((proj) => (
								<div
									key={proj.id}
									className="space-y-3 rounded-xl border border-border p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<Badge className="bg-[#00712D] text-white">
												{workflowLabel(proj.workflowStatus)}
											</Badge>
											<Badge
												variant="outline"
												className="border-emerald-700 text-emerald-700"
											>
												GHG LVV Verified
											</Badge>
										</div>
										<span className="text-sm text-muted-foreground">
											Project Value: {formatRupiah(proj.projectValue)}
										</span>
									</div>

									<div>
										<h4 className="text-base font-bold">{proj.title}</h4>
										<p className="mt-0.5 text-sm text-muted-foreground">
											Client: {proj.companyName} • Vendor: {proj.vendorName}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-2.5 text-sm">
										<div>
											<p className="text-muted-foreground">Projected IRR</p>
											<p className="font-bold text-emerald-700">
												{proj.financialProjections.irrPercent}% / year
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">Overall Risk</p>
											<p className="font-bold text-foreground">
												{proj.riskAssessment.overallRiskLevel} Risk
											</p>
										</div>
									</div>

									<div className="flex justify-end gap-2 border-t border-border pt-2">
										<Link to="/broker/projects/$id" params={{ id: proj.id }}>
											<Button
												size="sm"
												className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
											>
												Open Project Financial Details
											</Button>
										</Link>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Documents Awaiting Review</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{isLoadingDocumentRequests ? (
							Array.from({ length: 2 }, (_, index) => (
								<ShimmerBlock key={index} className="h-32 w-full" />
							))
						) : pendingDocs.length === 0 ? (
							<EmptyState
								icon={<FontAwesomeIcon icon={faFileAlt} />}
								title="No documents awaiting review"
								description="Client companies have not uploaded anything for review yet. Requests you raise from Document Requests appear here once a client submits a file."
							/>
						) : (
							<>
								{pendingDocsPage.pageRows.map((doc) => (
									<div
										key={doc.id}
										className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
									>
										<Badge variant="outline">{doc.category}</Badge>
										<h4 className="line-clamp-2 text-sm font-semibold">
											{doc.documentTypeName}
										</h4>
										<p className="text-muted-foreground">
											Client: {doc.companyName}
										</p>
										<div className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-200 pt-2">
											<span className="min-w-0 wrap-anywhere text-sm font-medium text-blue-700">
												File: {doc.submittedFileName}
											</span>
											<Button
												size="sm"
												onClick={() => approveDocument(doc.id)}
												className="shrink-0 bg-emerald-700 text-white hover:bg-emerald-700"
											>
												Approve
											</Button>
										</div>
									</div>
								))}
								<PaginationBar
									label="Documents awaiting review"
									pageIndex={pendingDocsPage.pageIndex}
									pageSize={pendingDocsPage.pageSize}
									pageCount={pendingDocsPage.pageCount}
									total={pendingDocsPage.total}
									onPageIndexChange={pendingDocsPage.setPageIndex}
									onPageSizeChange={pendingDocsPage.setPageSize}
								/>
							</>
						)}

						<Link to="/broker/document-requests" className="block pt-2">
							<Button variant="outline" size="sm" className="w-full">
								Manage All Document Requests
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle className="text-lg">
							Notifications
							{metrics.underMonitoringCount > 0 && (
								<span className="ml-2 text-sm font-normal text-muted-foreground">
									{metrics.underMonitoringCount} project(s) under monitoring
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{isLoadingNotifications ? (
							Array.from({ length: 3 }, (_, index) => (
								<ShimmerBlock key={index} className="h-20 w-full" />
							))
						) : notifications.length === 0 ? (
							<EmptyState
								icon={<FontAwesomeIcon icon={faBell} />}
								title="No notifications yet"
								description="Assignment decisions, client uploads, and review outcomes on your projects will appear here as they happen."
							/>
						) : (
							<>
								{notificationsPage.pageRows.map((notification) => (
									<div
										key={notification.id}
										className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
											notification.isRead
												? "border-border"
												: "border-emerald-500 bg-emerald-50/30"
										}`}
									>
										<div>
											<Badge variant="outline">{notification.category}</Badge>
											<h4 className="mt-1 text-sm font-semibold">
												{notification.title}
											</h4>
											<p className="mt-0.5 text-muted-foreground">
												{notification.message}
											</p>
											<p className="mt-1 text-sm text-muted-foreground">
												{notification.timestamp}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Link to={notification.linkUrl}>
												<Button variant="outline" size="sm">
													Open
												</Button>
											</Link>
											{!notification.isRead && (
												<Button
													size="sm"
													variant="ghost"
													className="text-emerald-700 hover:text-emerald-800"
													onClick={() => markNotificationRead(notification.id)}
												>
													Mark read
												</Button>
											)}
										</div>
									</div>
								))}
								<PaginationBar
									label="Notifications"
									pageIndex={notificationsPage.pageIndex}
									pageSize={notificationsPage.pageSize}
									pageCount={notificationsPage.pageCount}
									total={notificationsPage.total}
									onPageIndexChange={notificationsPage.setPageIndex}
									onPageSizeChange={notificationsPage.setPageSize}
								/>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
