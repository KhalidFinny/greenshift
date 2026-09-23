import type {
	VendorEnergyForecast as ApiEnergyForecast,
	VendorLeaderboardResponse as ApiLeaderboard,
	VendorMilestone as ApiMilestone,
	VendorMonthlyReport as ApiMonthlyReport,
	VendorNegotiation as ApiNegotiation,
	VendorNotification as ApiNotification,
	VendorPortfolioItem as ApiPortfolioItem,
	ProjectBlueprintView,
	ProposalDetail,
	ProposalSummary,
	VendorMyProject,
	VendorProfile,
	VendorProjectListItem,
} from "@greenshift/api/contracts";
import { relativeTime } from "@greenshift/ui";
import type {
	ActiveVendorProject,
	CompanyVerificationDetails,
	EnergyForecast,
	MonthlyEnergyReport,
	NegotiationRequest,
	OpenBidLeaderboardEntry,
	ProcurementMethod,
	ProjectMilestone,
	StructuredProposal,
	VendorBlueprint,
	VendorNotification,
	VendorPerformanceMetrics,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

export function mapVerificationStatus(
	profile: VendorProfile,
): CompanyVerificationDetails {
	return {
		status: profile.verified
			? "VERIFIED"
			: profile.rejectionReason
				? "REJECTED"
				: "NOT_VERIFIED",
		certifications: profile.certifications ?? [],
		nib: profile.nib ?? undefined,
		npwp: profile.npwp ?? undefined,
		tdp: profile.tdp ?? undefined,
		certificateName: profile.certificateName ?? undefined,
		certificateUrl: profile.certificateUrl ?? undefined,
		certificateScan: profile.certificateScan ?? null,
		rejectionReason: profile.rejectionReason ?? undefined,
		verifiedAt: profile.verifiedAt ?? undefined,
	};
}

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
		carbonReductionTargetTons: project.carbonReductionTargetTons ?? null,
		procurementMethod: method,
		tenderId: project.tender?.id ?? null,
		tenderDeadlineAt: project.tender?.deadlineAt ?? "",
		description: project.description ?? "",
		riskScore: project.riskScore ?? null,
		technicalRequirements: project.technicalRequirements,
		deliverables: project.deliverables,
		matchmaking: project.matchScore
			? {
					technicalFit: project.matchScore.technicalFit,
					relevantExperience: project.matchScore.relevantExperience,
					historicalPerformance: project.matchScore.historicalPerformance,
					priceAndValue: project.matchScore.priceValue,
					projectRisk: project.matchScore.projectRisk,
					overallMatch: project.matchScore.totalScore,
					rank: project.matchScore.rank,
				}
			: null,
		isSaved: false,
	};
}

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
	const forecasts = (myProject.forecasts ?? []).map(mapEnergyForecast);

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
		// No due date and no submission time means the date is genuinely unknown; today's date would invent a commitment.
		deadlineDate:
			milestones[milestones.length - 1]?.dueDate ??
			proposal.submittedAt ??
			null,
		status:
			progress >= 100
				? "COMPLETED"
				: progress >= 90
					? "COMMISSIONING"
					: "IN_PROGRESS",
		milestones,
		monthlyReports,
		forecasts,
		// The blueprint target is not part of this contract yet, so expected savings stay at 0.
		expectedEnergySavingsPercent: 0,
		actualEnergySavingsPercent: actualSavingsPercent,
		expectedCarbonReductionTons: project.targetEmissionReduction ?? 0,
		actualCarbonReductionTons: latestReport?.carbonSavedTons ?? undefined,
	};
}

/** An awarded project as a track-record entry: every figure comes from the award record or the project itself. */
export function mapToPortfolioItem(
	myProject: VendorMyProject,
): VendorPortfolioItem | null {
	if (!isAwardedProposal(myProject.proposal.status)) {
		return null;
	}

	const project = myProject.project;

	return {
		id: String(project.id),
		projectName: project.title,
		clientName: project.companyName ?? "",
		projectType: project.industrySector ?? "",
		location: project.location ?? "",
		description: "",
		projectValue: myProject.proposal.amount,
		// The award record carries no duration, services list, or completion year.
		durationMonths: null,
		servicesProvided: "",
		// The project reports kWh/yr saved, not a percentage.
		energySavingKwh: project.estimatedEnergySaving ?? null,
		energySavingPercent: null,
		carbonReductionTons: project.targetEmissionReduction ?? null,
		completionYear: null,
		documentName: undefined,
		// An awarded project carries no uploaded document of its own.
		documentUrl: null,
	};
}

/** List-row shape: only what the proposals list endpoint returns, with the detail-only figures left null rather than filled with plausible constants. */
export function mapToStructuredProposal(
	proposal: ProposalSummary,
): StructuredProposal {
	return {
		id: String(proposal.id),
		tenderId: String(proposal.tenderId ?? 0),
		projectId: String(proposal.projectId ?? 0),
		projectTitle: proposal.projectTitle ?? "",
		// The summary carries the vendor's own company, so the client is left empty until the detail is fetched.
		companyName: "",
		procurementMethod: "OPEN_BIDDING",
		status: mapProposalStatus(proposal.status),
		technicalSpec: null,
		projectedRoi: null,
		warrantyPeriod: null,
		costBreakdown: { totalPrice: proposal.amount, operationalCost: null },
		expectedImpact: { projectedRoiPercent: null },
		documentName: proposal.documentName ?? null,
		documentUrl: proposal.documentUrl ?? null,
		submittedAt: proposal.submittedAt ?? undefined,
		revisionCount: proposal.revisionCount,
	};
}

/** Full record from `GET /api/vendor/proposals/:id`, straight from the API. */
export function mapProposalDetail(detail: ProposalDetail): StructuredProposal {
	return {
		id: String(detail.id),
		tenderId: String(detail.tenderId ?? 0),
		projectId: String(detail.projectId ?? 0),
		projectTitle: detail.projectTitle ?? detail.project?.title ?? "",
		companyName: detail.project?.companyName ?? "",
		procurementMethod: "OPEN_BIDDING",
		status: mapProposalStatus(detail.status),
		technicalSpec: detail.technicalSpec,
		projectedRoi: detail.projectedRoi,
		warrantyPeriod: detail.warrantyPeriod,
		costBreakdown: {
			totalPrice: detail.amount,
			operationalCost: detail.operationalCost,
		},
		expectedImpact: { projectedRoiPercent: detail.projectedRoi },
		documentName: detail.documentName ?? null,
		documentUrl: detail.documentUrl ?? null,
		submittedAt: detail.submittedAt ?? undefined,
		revisionCount: detail.revisionCount,
	};
}

export function derivePerformanceMetrics(
	profile: VendorProfile,
	myProjects: VendorMyProject[],
): VendorPerformanceMetrics {
	const awarded = myProjects.filter((p) =>
		isAwardedProposal(p.proposal.status),
	);

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

	// MRV: measured savings and carbon against the project targets the API exposes on each awarded project.
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
		// The platform rating (0-5, set when an admin verifies the vendor) is the only quality signal the API stores.
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
		// The API stores no per-period history, so the trend starts empty.
		historicalTrend: [],
		bastRating: profile.rating ?? 0,
	};
}

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
		// Dated the way the feed reads it, from the one shared implementation.
		timestamp: relativeTime(row.createdAt),
		isRead: row.read,
		linkUrl: row.link ?? "/vendor",
	};
}

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
		annotations: row.annotations,
		vendorResponseNote: row.vendorResponseNote ?? undefined,
		vendorRevisedPrice: row.vendorRevisedPrice ?? undefined,
		vendorRevisedWarrantyYears: row.vendorRevisedWarrantyYears ?? undefined,
		vendorRevisedTimelineMonths: row.vendorRevisedTimelineMonths ?? undefined,
		updatedAt: row.updatedAt,
	};
}

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

export function mapPortfolioItem(row: ApiPortfolioItem): VendorPortfolioItem {
	return {
		id: String(row.id),
		projectName: row.projectName,
		clientName: row.clientName,
		projectType: row.projectType ?? "Energy Efficiency",
		location: row.location ?? "Unknown",
		description: row.description ?? "",
		projectValue: row.projectValue,
		durationMonths: row.durationMonths ?? null,
		servicesProvided: row.servicesProvided ?? "",
		energySavingKwh: null,
		energySavingPercent: row.energySavingPercent ?? null,
		carbonReductionTons: row.carbonReductionTons ?? null,
		completionYear: row.completionYear ?? null,
		documentName: row.documentName ?? undefined,
		documentUrl: row.documentUrl,
	};
}

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

/** Predictive periods the model projected for a project, newest first. */
export function mapEnergyForecast(row: ApiEnergyForecast): EnergyForecast {
	return {
		id: `${row.periodStart ?? "unknown"}-${row.periodEnd ?? "unknown"}`,
		period: (row.periodStart ?? "").slice(0, 7),
		forecastedConsumptionKwh: row.forecastedConsumption ?? 0,
		forecastedSavingsKwh: row.forecastedSavings ?? 0,
		modelName: row.modelName ?? "unknown",
		metrics: row.metrics ?? null,
	};
}

/** The blueprint a bidder reads on the procurement detail. The API only sends it once LVV GRK has validated it, so a blueprint here is verified; the status travels so the card can name the stage it reached. */
export function mapBlueprint(blueprint: ProjectBlueprintView): VendorBlueprint {
	return {
		status: blueprint.status,
		validatedAt: blueprint.validatedAt,
		irrPercent: blueprint.irr ?? null,
		npvAmount: blueprint.npv ?? null,
		paybackYears: blueprint.paybackPeriod ?? null,
		funding: blueprint.fundingStructure
			? {
					instrument: blueprint.fundingStructure.instrument,
					capexRp: blueprint.fundingStructure.capexRp,
					tenorYears: blueprint.fundingStructure.tenorYears,
					annualSavingRp: blueprint.fundingStructure.annualSavingRp,
					annualRevenueRp: blueprint.fundingStructure.annualRevenueRp,
					collateral: blueprint.fundingStructure.collateral,
				}
			: null,
		emissions: blueprint.emissionTargets
			? {
					baselineTco2: blueprint.emissionTargets.baselineTco2,
					targetPct: blueprint.emissionTargets.targetPct,
					targetTco2: blueprint.emissionTargets.targetTco2,
					energySavingKwh: blueprint.emissionTargets.energySavingKwh,
				}
			: null,
		scenarios: blueprint.scenarios.map((scenario) => ({
			key: scenario.key,
			label: scenario.label,
			savingPct: scenario.savingPct,
			inflationPct: scenario.inflationPct,
			degradationPct: scenario.degradationPct,
			npvAmount: scenario.npvRp,
			irrPercent: scenario.irrPct,
			paybackYears: scenario.paybackYears,
		})),
	};
}
