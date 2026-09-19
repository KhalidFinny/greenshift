export type VerificationStatus =
	| "NOT_VERIFIED"
	| "VERIFYING"
	| "VERIFIED"
	| "REJECTED";

export interface CompanyVerificationDetails {
	status: VerificationStatus;
	certifications: string[];
	nib?: string;
	npwp?: string;
	legalDocUrl?: string;
	escoCertificationUrl?: string;
	isoCertificationUrl?: string;
	rejectionReason?: string;
	submittedAt?: string;
	verifiedAt?: string;
}

/**
 * The matching model's output for one project, as the API returns it. Every
 * score is 0-100 and `projectRisk` is inverted, so a higher number always means
 * a better outcome. The criterion wording lives with the component that renders
 * it (`lib/matchmaking.ts`); only the scores are data.
 */
export interface MatchmakingBreakdown {
	technicalFit: number;
	relevantExperience: number;
	historicalPerformance: number;
	priceAndValue: number;
	projectRisk: number;
	/** Weighted total across the five criteria. */
	overallMatch: number;
	/** Position among the vendors scored for this project, 1 = best. */
	rank: number;
}

export type ProcurementMethod =
	| "OPEN_BIDDING"
	| "CLOSED_BIDDING"
	| "DIRECT_SELECTION";

export interface OpenBidLeaderboardEntry {
	rank: number;
	vendorName: string;
	isCurrentVendor: boolean;
	currentPrice: number;
	updatedAt: string;
}

export type ProposalStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "UNDER_EVALUATION"
	| "RANKED"
	| "SELECTED"
	| "NEGOTIATION"
	| "AGREED"
	| "REJECTED"
	| "CLOSED";

export interface CostBreakdown {
	/** The submitted amount. This is the only cost figure the API guarantees. */
	totalPrice: number;
	/** Reported separately by the vendor; null when the API has no value. */
	operationalCost: number | null;
}

export interface ExpectedImpact {
	/** Null when the API has no value. Never defaulted to a plausible figure. */
	projectedRoiPercent: number | null;
}

export interface StructuredProposal {
	id: string;
	tenderId: string;
	projectId: string;
	projectTitle: string;
	/** The client company, from the proposal detail. Empty when the API has none. */
	companyName: string;
	procurementMethod: ProcurementMethod;
	status: ProposalStatus;
	/** Detail-endpoint fields. Null until the detail is fetched, or when absent. */
	technicalSpec: string | null;
	projectedRoi: number | null;
	warrantyPeriod: number | null;
	costBreakdown: CostBreakdown;
	expectedImpact: ExpectedImpact;
	submittedAt?: string;
	revisionCount: number;
}

export type Priority = "urgent" | "high" | "medium" | "low";

export interface NegotiationRequest {
	id: string;
	proposalId: string;
	projectId: string;
	projectTitle: string;
	companyName: string;
	iterationNumber: number; // 1, 2, or 3
	maxIterations: number; // 3
	status:
		| "PENDING_VENDOR_RESPONSE"
		| "SUBMITTED_BY_VENDOR"
		| "AGREED"
		| "LOCKED";
	priority?: Priority;
	requestedPriceReduction?: number;
	requestedWarrantyYears?: number;
	requestedTimelineMonths?: number;
	requestedFields: string[]; // e.g. ["Price", "Warranty"]
	companyNote: string;
	vendorResponseNote?: string;
	vendorRevisedPrice?: number;
	vendorRevisedWarrantyYears?: number;
	vendorRevisedTimelineMonths?: number;
	updatedAt: string;
}

export type MilestoneStatus =
	| "NOT_STARTED"
	| "IN_PROGRESS"
	| "SUBMITTED_FOR_REVIEW"
	| "APPROVED"
	| "REVISION_REQUIRED"
	| "COMPLETED";

export interface EvidenceFile {
	id: string;
	name: string;
	type: "photo" | "video" | "document" | "inspection" | "energy_data";
	url: string;
	uploadedAt: string;
}

export interface ProjectMilestone {
	id: string;
	stepNumber: number;
	title: string;
	description: string;
	startDate: string;
	dueDate: string;
	completionPercent: number;
	status: MilestoneStatus;
	evidence: EvidenceFile[];
	vendorNotes?: string;
	companyReviewNotes?: string;
}

export interface MonthlyEnergyReport {
	id: string;
	projectId: string;
	period: string; // e.g. "2026-08"
	energySavedKwh: number;
	carbonSavedTons: number;
	actualConsumptionKwh: number;
	baselineConsumptionKwh: number;
	evidenceDocs: string[];
	submittedAt: string;
}

/**
 * One predictive-analytics period: what the model expects the site to consume
 * and save, with the accuracy metrics it was scored on. Periods run forward from
 * the last reported month, so they are directly comparable with the actuals
 * above.
 */
export interface EnergyForecast {
	id: string;
	period: string; // e.g. "2026-10"
	forecastedConsumptionKwh: number;
	forecastedSavingsKwh: number;
	modelName: string;
	metrics: {
		mae?: number;
		rmse?: number;
		r2?: number;
		cvRmse?: number;
	} | null;
}

export interface ActiveVendorProject {
	id: string;
	title: string;
	companyName: string;
	industrySector: string;
	location: string;
	agreedBudget: number;
	overallProgressPercent: number;
	currentMilestoneTitle: string;
	deadlineDate: string | null;
	status: "IN_PROGRESS" | "COMMISSIONING" | "COMPLETED";
	milestones: ProjectMilestone[];
	monthlyReports: MonthlyEnergyReport[];
	/** Predictive periods, newest first. Empty when the model has not run. */
	forecasts: EnergyForecast[];
	expectedEnergySavingsPercent: number;
	actualEnergySavingsPercent?: number;
	expectedCarbonReductionTons: number;
	actualCarbonReductionTons?: number;
}

export interface VendorPortfolioItem {
	id: string;
	projectName: string;
	clientName: string;
	projectType: string;
	location: string;
	description: string;
	projectValue: number;
	/** Null when the record has no figure. Never defaulted to a plausible one. */
	durationMonths: number | null;
	servicesProvided: string;
	/**
	 * Two different quantities share this record type. An awarded project reports
	 * the saving in kWh/yr from the project itself; a vendor-authored record
	 * reports a percentage the vendor entered. Keeping them apart stops the
	 * kWh figure from being printed with a percent sign.
	 */
	energySavingKwh: number | null;
	energySavingPercent: number | null;
	carbonReductionTons: number | null;
	completionYear: number | null;
	status: "COMPLETED" | "VERIFIED";
	documentName?: string;
}

export interface VendorPerformanceMetrics {
	completionRatePercent: number; // e.g. 98%
	onTimeCompletionPercent: number; // e.g. 95%
	technicalPerformanceScore: number; // e.g. 94/100
	energySavingAchievementPercent: number; // e.g. 104% (exceeded baseline)
	carbonReductionAchievementPercent: number; // e.g. 106%
	averageProjectValue: number;
	totalCompletedProjects: number;
	clientApprovalRatePercent: number;
	historicalTrend: { period: string; score: number }[];
	bastRating?: number;
	retentionRate?: string;
}

export interface VendorNotification {
	id: string;
	category: "Tenders" | "Projects" | "Negotiation" | "Verification" | "System";
	title: string;
	message: string;
	timestamp: string;
	isRead: boolean;
	linkUrl: string;
}

export interface VendorProjectCardData {
	id: string;
	title: string;
	companyName: string;
	industrySector: string;
	location: string;
	estimatedValue: number;
	clientBudget: number;
	/** Tonnes of CO2e the project targets; null when the company has not set one. */
	carbonReductionTargetTons: number | null;
	procurementMethod: ProcurementMethod;
	tenderDeadlineAt: string;
	/** Null until the matching model has scored this project for the vendor. */
	matchmaking: MatchmakingBreakdown | null;
	priority?: Priority;
	isSaved?: boolean;
	/** For DIRECT_SELECTION: only the invited vendor can see this project */
	invitedVendorId?: string;
	description: string;
	/** Assessed risk score; null when the project has not been assessed. */
	riskScore: number | null;
	technicalRequirements: string[];
	deliverables: string[];
}
