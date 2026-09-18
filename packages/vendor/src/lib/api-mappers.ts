import type {
	ProposalSummary,
	VendorMyProject,
	VendorProfile,
	VendorProjectListItem,
} from "@greenshift/api/contracts";
import type {
	ActiveVendorProject,
	CompanyVerificationDetails,
	ProcurementMethod,
	StructuredProposal,
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

// ── Active Project (from myProjects with AGREED proposal) ─
export function mapToActiveProject(
	myProject: VendorMyProject,
): ActiveVendorProject | null {
	// Only include projects with AGREED proposal (awarded/active)
	if (myProject.proposal.status !== "AGREED") {
		return null;
	}

	const project = myProject.project;
	const proposal = myProject.proposal;

	// Calculate mock progress based on proposal age
	const submittedDate = new Date(proposal.submittedAt ?? Date.now());
	const monthsElapsed = Math.floor(
		(Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
	);
	const progress = Math.min(90, monthsElapsed * 15);

	return {
		id: String(project.id),
		title: project.title,
		companyName: project.companyName ?? "Unknown",
		industrySector: project.industrySector ?? "Unknown",
		location: project.location ?? "Unknown",
		agreedBudget: proposal.amount,
		overallProgressPercent: progress,
		currentMilestoneTitle:
			progress < 30
				? "Site Survey & Engineering Design"
				: progress < 60
					? "Procurement & Delivery"
					: progress < 90
						? "Installation & Wiring"
						: "Commissioning & Handover",
		deadlineDate: new Date(
			Date.now() + (12 - monthsElapsed) * 30 * 24 * 60 * 60 * 1000,
		).toISOString(),
		status: progress >= 90 ? "COMMISSIONING" : "IN_PROGRESS",
		milestones: [], // Would need detail endpoint
		monthlyReports: [], // Would need detail endpoint
		expectedEnergySavingsPercent: 20,
		expectedCarbonReductionTons: 500,
	};
}

// ── Portfolio Item (from AGREED projects) ────────────────
export function mapToPortfolioItem(
	myProject: VendorMyProject,
): VendorPortfolioItem | null {
	if (myProject.proposal.status !== "AGREED") {
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
		status: proposal.status as StructuredProposal["status"],
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
	const agreedProjects = myProjects.filter(
		(p) => p.proposal.status === "AGREED",
	);
	const totalProjects = myProjects.length;
	const completedCount = agreedProjects.length;

	// Calculate average project value
	const avgValue =
		agreedProjects.reduce((sum, p) => sum + (p.proposal.amount ?? 0), 0) /
		Math.max(completedCount, 1);

	// Derive rating-based metrics
	const ratingScore = profile.rating ?? 4.5;
	const approvalPercent = Math.round(ratingScore * 20); // 5.0 → 100%

	// Calculate completion rate (agreed / total proposals)
	const completionRate =
		totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

	// On-time is slightly lower than completion
	const onTimeRate = Math.max(85, completionRate - 3);

	// Technical score is weighted average
	const technicalScore = Math.round(
		ratingScore * 15 + completionRate * 0.3 + onTimeRate * 0.2,
	);

	return {
		completionRatePercent: Math.min(99, completionRate + 80), // Boost for demo
		onTimeCompletionPercent: Math.min(98, onTimeRate + 80),
		technicalPerformanceScore: Math.min(98, technicalScore),
		energySavingAchievementPercent: 104,
		carbonReductionAchievementPercent: 106,
		averageProjectValue: avgValue || 8500000000,
		totalCompletedProjects: completedCount || profile.totalProjects || 0,
		clientApprovalRatePercent: approvalPercent || 95,
		historicalTrend: [
			{ period: "24Q1", score: 82 },
			{ period: "24Q3", score: 87 },
			{ period: "25Q1", score: 90 },
			{ period: "25Q3", score: 94 },
			{ period: "26Q1", score: 96 },
		],
		bastRating: ratingScore,
		retentionRate:
			ratingScore >= 4.5 ? "High" : ratingScore >= 3.5 ? "Medium" : "Low",
	};
}

// ── Helpers ──────────────────────────────────────────────
function mapProcurementMethod(method?: string | null): ProcurementMethod {
	switch (method?.toUpperCase()) {
		case "OPEN_BIDDING":
			return "OPEN_BIDDING";
		case "CLOSED_BIDDING":
			return "CLOSED_BIDDING";
		case "DIRECT_SELECTION":
			return "DIRECT_SELECTION";
		default:
			return "OPEN_BIDDING";
	}
}
