import type {
	VendorLeaderboardResponse as ApiLeaderboard,
	VendorMilestone as ApiMilestone,
	VendorMonthlyReport as ApiMonthlyReport,
	VendorNegotiation as ApiNegotiation,
	VendorNotification as ApiNotification,
	VendorPortfolioItem as ApiPortfolioItem,
	ProposalSummary,
	VendorMyProject,
	VendorProfile,
	VendorProjectListItem,
} from "@greenshift/api/contracts";
import type {
	ActiveVendorProject,
	CompanyVerificationDetails,
	MonthlyEnergyReport,
	NegotiationRequest,
	OpenBidLeaderboardEntry,
	ProcurementMethod,
	ProjectMilestone,
	StructuredProposal,
	VendorNotification,
	VendorPerformanceMetrics,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

// ── Verification Status ──────────────────────────────────
export function mapVerificationStatus(
	profile: VendorProfile,
): CompanyVerificationDetails {
	return {
		status: profile.verified ? "VERIFIED" : "NOT_VERIFIED",
		certifications: profile.certifications ?? [],
		nib: undefined, // Not stored in backend yet
		npwp: undefined,
		legalDocUrl: undefined,
		escoCertificationUrl: profile.certifications[0] ?? undefined,
		isoCertificationUrl: profile.certifications[1] ?? undefined,
		submittedAt: profile.createdAt ?? undefined,
		verifiedAt: profile.verifiedAt ?? undefined,
	};
}

// ── Project Card Data (for Opportunities page) ───────────
export function mapProjectToCardData(
	project: VendorProjectListItem,
): VendorProjectCardData {
	const method = mapProcurementMethod(project.tender?.method);

	return {
		id: String(project.id),
		title: project.title,
		companyName: project.companyName ?? "Unknown Company",
		industrySector: project.industrySector ?? "Unknown",
		location: project.location ?? "Unknown",
		estimatedValue: project.tender?.budgetMax ?? project.budget ?? 0,
		clientBudget: project.tender?.budgetMax ?? project.budget ?? 0,
		carbonReductionTargetTons: 0, // Not available in API
		procurementMethod: method,
		tenderDeadlineAt: project.tender?.deadlineAt ?? new Date().toISOString(),
		description: "", // Would need project detail endpoint
		riskScore: project.riskScore ?? 75,
		technicalRequirements: [], // Would need project detail endpoint
		deliverables: [], // Would need project detail endpoint
		matchmaking: {
			technicalFit: 85,
			technicalFitExplanation: "Based on your company profile",
			relevantExperience: 80,
			relevantExperienceExplanation: "Based on historical projects",
			historicalPerformance: 85,
			historicalPerformanceExplanation: "Based on completion rate",
			priceAndValue: 82,
			priceAndValueExplanation: "Based on budget alignment",
			projectRisk: 80,
			projectRiskExplanation: "Moderate risk assessment",
			overallMatch: 82,
		},
		isSaved: false,
	};
}

// ── Active Project (from myProjects with an awarded proposal) ─
export function mapToActiveProject(
	myProject: VendorMyProject,
): ActiveVendorProject | null {
	// Only projects whose proposal was accepted are in delivery.
	if (!isAwardedProposal(myProject.proposal.status)) {
		return null;
	}

	const project = myProject.project;
	const proposal = myProject.proposal;
	const milestones = (myProject.milestones ?? []).map(mapMilestone);
	const monthlyReports = (myProject.monthlyReports ?? []).map(mapMonthlyReport);

	const progress =
		milestones.length > 0
			? Math.round(
					milestones.reduce(
						(sum, milestone) => sum + milestone.completionPercent,
						0,
					) / milestones.length,
				)
			: 0;
	const current =
		milestones.find(
			(milestone) =>
				milestone.status !== "COMPLETED" && milestone.status !== "APPROVED",
		) ?? milestones[milestones.length - 1];

	const latestReport = monthlyReports[0];
	const baseline = latestReport?.baselineConsumptionKwh ?? 0;
	const actualSavingsPercent =
		baseline > 0 && latestReport?.energySavedKwh != null
			? Math.round((latestReport.energySavedKwh / baseline) * 1000) / 10
			: undefined;

	return {
		id: String(project.id),
		title: project.title,
		companyName: project.companyName ?? "Unknown",
		industrySector: project.industrySector ?? "Unknown",
		location: project.location ?? "Unknown",
		agreedBudget: proposal.amount,
		overallProgressPercent: progress,
		currentMilestoneTitle: current?.title ?? "Not started",
		deadlineDate:
			milestones[milestones.length - 1]?.dueDate ??
			proposal.submittedAt ??
			new Date().toISOString(),
		status:
			progress >= 100
				? "COMPLETED"
				: progress >= 90
					? "COMMISSIONING"
					: "IN_PROGRESS",
		milestones,
		monthlyReports,
		// The blueprint target is not part of this contract yet, so the
		// expected savings stay at 0 until the project exposes them.
		expectedEnergySavingsPercent: 0,
		actualEnergySavingsPercent: actualSavingsPercent,
		expectedCarbonReductionTons: project.targetEmissionReduction ?? 0,
		actualCarbonReductionTons: latestReport?.carbonSavedTons ?? undefined,
	};
}

// ── Portfolio Item (from AGREED projects) ────────────────
export function mapToPortfolioItem(
	myProject: VendorMyProject,
): VendorPortfolioItem | null {
	if (!isAwardedProposal(myProject.proposal.status)) {
		return null;
	}

	const project = myProject.project;
	const proposal = myProject.proposal;
	const submittedDate = new Date(proposal.submittedAt ?? Date.now());

	return {
		id: String(project.id),
		projectName: project.title,
		clientName: project.companyName ?? "Unknown Client",
		projectType: "Energy Efficiency",
		location: project.location ?? "Unknown",
		description: `Completed project for ${project.companyName}`,
		projectValue: proposal.amount,
		durationMonths: 6,
		servicesProvided: "EPC Turnkey",
		energySavingPercent: 22,
		carbonReductionTons: 450,
		completionYear: submittedDate.getFullYear(),
		status: "VERIFIED",
		documentName: undefined,
	};
}

// ── Structured Proposal ──────────────────────────────────
export function mapToStructuredProposal(
	proposal: ProposalSummary,
): StructuredProposal {
	return {
		id: String(proposal.id),
		tenderId: String(proposal.tenderId ?? 0),
		projectId: String(proposal.projectId ?? 0),
		projectTitle: proposal.projectTitle ?? "Unknown Project",
		companyName: proposal.vendorCompanyName ?? "Unknown",
		procurementMethod: "OPEN_BIDDING",
		status: mapProposalStatus(proposal.status),
		executiveSummary: "",
		technicalSolution: "",
		equipmentSpecs: "",
		includedScope: "",
		excludedScope: "",
		estimatedStartDate: proposal.submittedAt ?? new Date().toISOString(),
		estimatedDurationMonths: 6,
		costBreakdown: {
			equipmentCost: proposal.amount * 0.65,
			installationCost: proposal.amount * 0.15,
			laborCost: proposal.amount * 0.1,
			operationalCost: proposal.amount * 0.05,
			otherCost: proposal.amount * 0.05,
			totalPrice: proposal.amount,
		},
		expectedImpact: {
			energySavingsPercent: 22,
			carbonReductionTons: 450,
			projectedRoiPercent: 18,
		},
		warrantyYears: 5,
		warrantyCoverage: "Full system warranty",
		submittedAt: proposal.submittedAt ?? undefined,
		revisionCount: proposal.revisionCount,
	};
}

// ── Performance Metrics (derived from profile + projects) ─
export function derivePerformanceMetrics(
	profile: VendorProfile,
	myProjects: VendorMyProject[],
): VendorPerformanceMetrics {
	const awarded = myProjects.filter((p) =>
		isAwardedProposal(p.proposal.status),
	);

	// Delivery state across the awarded projects.
	const milestones = awarded.flatMap((p) => p.milestones ?? []);
	const settled = milestones.filter(
		(m) => m.status === "COMPLETED" || m.status === "APPROVED",
	);
	const overdue = milestones.filter(
		(m) =>
			m.dueDate !== null &&
			new Date(m.dueDate) < new Date() &&
			m.status !== "COMPLETED" &&
			m.status !== "APPROVED",
	);
	const completionRatePercent = milestones.length
		? Math.round((settled.length / milestones.length) * 100)
		: 0;
	const onTimeCompletionPercent = milestones.length
		? Math.round(
				((milestones.length - overdue.length) / milestones.length) * 100,
			)
		: 0;

	// MRV: measured savings and carbon against the project targets the API
	// exposes on each awarded project.
	const reports = awarded.flatMap((p) => p.monthlyReports ?? []);
	const baseline = reports.reduce(
		(sum, report) => sum + (report.baselineConsumption ?? 0),
		0,
	);
	const saved = reports.reduce(
		(sum, report) => sum + (report.energySavedKwh ?? 0),
		0,
	);
	const actualCarbon = reports.reduce(
		(sum, report) => sum + (report.carbonSavedTons ?? 0),
		0,
	);
	const targetCarbon = awarded.reduce(
		(sum, p) => sum + (p.project.targetEmissionReduction ?? 0),
		0,
	);

	const averageProjectValue = awarded.length
		? Math.round(
				awarded.reduce((sum, p) => sum + p.proposal.amount, 0) / awarded.length,
			)
		: 0;

	return {
		completionRatePercent,
		onTimeCompletionPercent,
		// The platform rating (0-5, set when an admin verifies the vendor)
		// is the only quality signal the API stores.
		technicalPerformanceScore: Math.round((profile.rating ?? 0) * 20),
		energySavingAchievementPercent: baseline
			? Math.round((saved / baseline) * 1000) / 10
			: 0,
		carbonReductionAchievementPercent: targetCarbon
			? Math.round((actualCarbon / targetCarbon) * 1000) / 10
			: 0,
		averageProjectValue,
		totalCompletedProjects: awarded.filter(
			(p) =>
				(p.milestones?.length ?? 0) > 0 &&
				(p.milestones ?? []).every(
					(m) => m.status === "COMPLETED" || m.status === "APPROVED",
				),
		).length,
		// No endorsement source in the API yet.
		clientApprovalRatePercent: 0,
		historicalTrend: [],
		bastRating: profile.rating ?? 0,
	};
}

// ── Helpers ──────────────────────────────────────────────
function mapProcurementMethod(method?: string | null): ProcurementMethod {
	switch (method?.toLowerCase()) {
		case "closed":
		case "closed_bidding":
			return "CLOSED_BIDDING";
		case "direct":
		case "direct_selection":
			return "DIRECT_SELECTION";
		default:
			return "OPEN_BIDDING";
	}
}

/** DB proposal status -> UI status vocabulary. */
const PROPOSAL_STATUS: Record<string, StructuredProposal["status"]> = {
	submitted: "SUBMITTED",
	reviewed: "UNDER_EVALUATION",
	revision: "NEGOTIATION",
	accepted: "SELECTED",
	rejected: "REJECTED",
};

export function mapProposalStatus(
	status: string,
): StructuredProposal["status"] {
	return PROPOSAL_STATUS[status.toLowerCase()] ?? "DRAFT";
}

/** A proposal counts as awarded in either vocabulary. */
export function isAwardedProposal(status: string): boolean {
	const normalized = status.toLowerCase();
	return normalized === "accepted" || normalized === "agreed";
}

// ── Notifications ────────────────────────────────────────
const NOTIFICATION_CATEGORY: Record<string, VendorNotification["category"]> = {
	negotiation: "Negotiation",
	deadline: "Tenders",
	status_change: "Projects",
	verification: "Verification",
	system: "System",
};

export function mapNotification(row: ApiNotification): VendorNotification {
	return {
		id: String(row.id),
		category: NOTIFICATION_CATEGORY[row.type.toLowerCase()] ?? "System",
		title: row.title,
		message: row.body ?? "",
		timestamp: row.createdAt,
		isRead: row.read,
		linkUrl: row.link ?? "/vendor",
	};
}

// ── Negotiations ─────────────────────────────────────────
export function mapNegotiation(row: ApiNegotiation): NegotiationRequest {
	return {
		id: String(row.id),
		proposalId: String(row.proposalId),
		projectId: String(row.projectId ?? 0),
		projectTitle: row.projectTitle,
		companyName: row.companyName ?? "Unknown Company",
		iterationNumber: row.iterationNumber,
		maxIterations: row.maxIterations,
		status: row.status as NegotiationRequest["status"],
		requestedPriceReduction: row.requestedPriceReduction ?? undefined,
		requestedWarrantyYears: row.requestedWarrantyYears ?? undefined,
		requestedTimelineMonths: row.requestedTimelineMonths ?? undefined,
		requestedFields: row.requestedFields,
		companyNote: row.companyNote,
		vendorResponseNote: row.vendorResponseNote ?? undefined,
		vendorRevisedPrice: row.vendorRevisedPrice ?? undefined,
		vendorRevisedWarrantyYears: row.vendorRevisedWarrantyYears ?? undefined,
		vendorRevisedTimelineMonths: row.vendorRevisedTimelineMonths ?? undefined,
		updatedAt: row.updatedAt,
	};
}

// ── Open-bid leaderboard ─────────────────────────────────
export interface LeaderboardView {
	entries: OpenBidLeaderboardEntry[];
	tenderId: string | null;
	projectTitle: string | null;
	deadlineAt: string | null;
	myProposalId: string | null;
	myAmount: number | null;
	myRank: number | null;
}

export function mapLeaderboard(response: ApiLeaderboard): LeaderboardView {
	return {
		entries: response.entries.map((entry) => ({
			rank: entry.rank,
			vendorName: entry.vendorName,
			isCurrentVendor: entry.isCurrentVendor,
			currentPrice: entry.amount,
			updatedAt: entry.updatedAt,
		})),
		tenderId: response.tender ? String(response.tender.id) : null,
		projectTitle: response.tender?.projectTitle ?? null,
		deadlineAt: response.tender?.deadlineAt ?? null,
		myProposalId: response.myProposalId ? String(response.myProposalId) : null,
		myAmount: response.myAmount,
		myRank: response.myRank,
	};
}

// ── Portfolio entries authored by the vendor ─────────────
export function mapPortfolioItem(row: ApiPortfolioItem): VendorPortfolioItem {
	return {
		id: String(row.id),
		projectName: row.projectName,
		clientName: row.clientName,
		projectType: row.projectType ?? "Energy Efficiency",
		location: row.location ?? "Unknown",
		description: row.description ?? "",
		projectValue: row.projectValue,
		durationMonths: row.durationMonths ?? 0,
		servicesProvided: row.servicesProvided ?? "",
		energySavingPercent: row.energySavingPercent ?? 0,
		carbonReductionTons: row.carbonReductionTons ?? 0,
		completionYear: row.completionYear ?? new Date().getFullYear(),
		status: row.status === "VERIFIED" ? "VERIFIED" : "COMPLETED",
		documentName: row.documentName ?? undefined,
	};
}

// ── Delivery (milestones + MRV reports) ──────────────────
export function mapMilestone(row: ApiMilestone): ProjectMilestone {
	return {
		id: String(row.id),
		stepNumber: row.stepNumber,
		title: row.title,
		description: row.description ?? "",
		startDate: row.startDate ?? "",
		dueDate: row.dueDate ?? "",
		completionPercent: row.completionPercent ?? 0,
		status: row.status as ProjectMilestone["status"],
		evidence: row.evidence.map((file) => ({
			id: String(file.id),
			name: file.fileName,
			type: file.kind as ProjectMilestone["evidence"][number]["type"],
			url: file.fileUrl ?? "#",
			uploadedAt: file.uploadedAt,
		})),
		vendorNotes: row.vendorNotes ?? undefined,
		companyReviewNotes: row.companyReviewNotes ?? undefined,
	};
}

export function mapMonthlyReport(row: ApiMonthlyReport): MonthlyEnergyReport {
	return {
		id: String(row.id),
		projectId: String(row.projectId),
		period: row.period,
		energySavedKwh: row.energySavedKwh ?? 0,
		carbonSavedTons: row.carbonSavedTons ?? 0,
		actualConsumptionKwh: row.actualConsumption ?? 0,
		baselineConsumptionKwh: row.baselineConsumption ?? 0,
		evidenceDocs: row.evidenceDocs,
		submittedAt: row.submittedAt,
	};
}
