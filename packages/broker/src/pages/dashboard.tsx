import {
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
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

import { workflowLabel } from "../lib/lifecycle";
import { useBrokerData } from "../lib/use-broker-data";

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
		approveDocument,
		markNotificationRead,
	} = useBrokerData();

	const isVerified = verification.status === "VERIFIED";
	const pendingDocs = documentRequests.filter(
		(d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
	);

	return (
		<div className="space-y-6">
			{/* Unverified Warning Alert */}
			{!isVerified && (
				<div className="flex items-start justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
					<div className="flex items-start gap-3">
						<FontAwesomeIcon
							icon={faExclamationTriangle}
							className="mt-0.5 text-xl text-amber-600 dark:text-amber-400"
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
							className="bg-amber-600 text-white hover:bg-amber-700"
						>
							Complete Verification
						</Button>
					</Link>
				</div>
			)}

			{/* KPI Workload Stat Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* 1. Assigned Projects */}
				<Card>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Assigned Projects
							</p>
							<h3 className="mt-2 text-3xl font-bold">
								{metrics.assignedProjectsCount}
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								GHG LVV Verified Projects
							</p>
						</div>
						<div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
							<FontAwesomeIcon icon={faLeaf} className="text-xl" />
						</div>
					</CardContent>
				</Card>

				{/* 2. Document Request */}
				<Card>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Document Request
							</p>
							<h3 className="mt-2 text-3xl font-bold">
								{metrics.outstandingRequestsCount}
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								Awaiting Client Response
							</p>
						</div>
						<div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
							<FontAwesomeIcon icon={faClock} className="text-xl" />
						</div>
					</CardContent>
				</Card>

				{/* 3. Review Documents */}
				<Card>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Review Documents
							</p>
							<h3 className="mt-2 text-3xl font-bold">
								{metrics.awaitingReviewCount}
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								Uploaded by Client Companies
							</p>
						</div>
						<div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
							<FontAwesomeIcon icon={faFileAlt} className="text-xl" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Grid: Projects & Documents Pending Review */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Left 2 Cols: Assigned Projects Workload */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg">
							Verified Assigned Projects
						</CardTitle>
						<Link
							to="/broker/projects"
							className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
						>
							View All Projects →
						</Link>
					</CardHeader>
					<CardContent className="space-y-4">
						{projects.slice(0, 2).map((proj) => (
							<div
								key={proj.id}
								className="rounded-xl border border-border p-4 space-y-3"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Badge className="bg-[#03442C] text-white font-semibold">
											{workflowLabel(proj.workflowStatus)}
										</Badge>
										<Badge
											variant="outline"
											className="border-emerald-500 text-emerald-700 dark:text-emerald-300"
										>
											GHG LVV Verified
										</Badge>
									</div>
									<span className="text-xs text-muted-foreground">
										Project Value: {formatRupiah(proj.projectValue)}
									</span>
								</div>

								<div>
									<h4 className="font-bold text-base">{proj.title}</h4>
									<p className="text-xs text-muted-foreground mt-0.5">
										Client: {proj.companyName} • Vendor: {proj.vendorName}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-2.5 text-xs">
									<div>
										<p className="text-muted-foreground">Projected IRR</p>
										<p className="font-bold text-emerald-600 dark:text-emerald-400">
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

								<div className="flex justify-end gap-2 pt-2 border-t border-border">
									<Link to="/broker/projects/$id" params={{ id: proj.id }}>
										<Button
											size="sm"
											className="bg-[#03442C] text-white hover:bg-[#03442C]/90"
										>
											Open Project Financial Details
										</Button>
									</Link>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Right 1 Col: Documents Pending Review */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Documents Awaiting Review</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-xs">
						{pendingDocs.length === 0 ? (
							<p className="text-muted-foreground text-center py-6">
								No documents currently awaiting review.
							</p>
						) : (
							pendingDocs.map((doc) => (
								<div
									key={doc.id}
									className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30 space-y-2"
								>
									<Badge className="bg-blue-600 text-white">
										{doc.category} Document
									</Badge>
									<h4 className="font-semibold text-sm line-clamp-2">
										{doc.documentTypeName}
									</h4>
									<p className="text-muted-foreground">
										Client: {doc.companyName}
									</p>
									<div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
										<span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
											File: {doc.submittedFileName}
										</span>
										<Button
											size="sm"
											onClick={() => approveDocument(doc.id)}
											className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
										>
											Approve
										</Button>
									</div>
								</div>
							))
						)}

						<Link to="/broker/document-requests" className="block pt-2">
							<Button variant="outline" size="sm" className="w-full">
								Manage All Document Requests →
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Right 1 Col: Notification feed */}
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle className="text-lg">
							Notifications
							{metrics.underMonitoringCount > 0 && (
								<span className="ml-2 text-xs font-normal text-muted-foreground">
									{metrics.underMonitoringCount} project(s) under monitoring
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-xs">
						{notifications.length === 0 ? (
							<p className="py-6 text-center text-muted-foreground">
								No notifications yet.
							</p>
						) : (
							notifications.map((notification) => (
								<div
									key={notification.id}
									className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
										notification.isRead
											? "border-border"
											: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
									}`}
								>
									<div>
										<Badge variant="outline" className="text-[11px]">
											{notification.category}
										</Badge>
										<h4 className="mt-1 font-semibold text-sm">
											{notification.title}
										</h4>
										<p className="mt-0.5 text-muted-foreground">
											{notification.message}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											{notification.timestamp}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Link to={notification.linkUrl}>
											<Button variant="outline" size="sm" className="text-xs">
												Open
											</Button>
										</Link>
										{!notification.isRead && (
											<Button
												size="sm"
												variant="ghost"
												className="text-xs"
												onClick={() => markNotificationRead(notification.id)}
											>
												Mark read
											</Button>
										)}
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
