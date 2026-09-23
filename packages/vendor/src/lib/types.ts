import type { CompanyDocumentScan } from "@greenshift/api/contracts";
import type { ProposalAnnotation } from "@greenshift/ui";

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
	tdp?: string;
	certificateName?: string;
	certificateUrl?: string;
	certificateScan?: CompanyDocumentScan | null;
	rejectionReason?: string;
	verifiedAt?: string;
}

/** Scores are 0-100 and `projectRisk` is inverted, so higher is always better. */
export interface MatchmakingBreakdown {
	technicalFit: number;
	relevantExperience: number;
	historicalPerformance: number;
	priceAndValue: number;
	projectRisk: number;
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
	/** The only cost figure the API guarantees. */
	totalPrice: number;
	operationalCost: number | null;
}

export interface ExpectedImpact {
	/** Null when the API has no value, never a plausible default. */
	projectedRoiPercent: number | null;
}

export interface StructuredProposal {
	id: string;
	tenderId: string;
	projectId: string;
	projectTitle: string;
	/** Empty in the list shape; only the detail endpoint carries it. */
	companyName: string;
	procurementMethod: ProcurementMethod;
	status: ProposalStatus;
	/** Detail-only: null until the detail is fetched. */
	technicalSpec: string | null;
	projectedRoi: number | null;
	warrantyPeriod: number | null;
	costBreakdown: CostBreakdown;
	expectedImpact: ExpectedImpact;
	/** Null when no PDF is filed. */
	documentName: string | null;
	documentUrl: string | null;
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
	/** Coordinates in the proposal page's fractions. */
	annotations: ProposalAnnotation[];
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

/** Periods run forward from the last reported month, so they compare with the actuals above. */
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
	/** Newest first. Empty when the model has not run. */
	forecasts: EnergyForecast[];
	expectedEnergySavingsPercent: number;
	actualEnergySavingsPercent?: number;
	expectedCarbonReductionTons: number;
	actualCarbonReductionTons?: number;
}

/** Derived from the milestone schedule, not stored. */
export type PortfolioProjectStatus =
	| "IN_PROGRESS"
	| "COMMISSIONING"
	| "COMPLETED";

export const PORTFOLIO_STATUS_LABEL: Record<PortfolioProjectStatus, string> = {
	IN_PROGRESS: "In progress",
	COMMISSIONING: "Commissioning",
	COMPLETED: "Completed",
};

export interface VendorPortfolioItem {
	id: string;
	projectName: string;
	clientName: string;
	projectType: string;
	location: string;
	description: string;
	projectValue: number;
	durationMonths: number | null;
	servicesProvided: string;
	/** Two quantities share this record type: an awarded project reports kWh/yr saved, a vendor-authored one a percentage the vendor entered. */
	energySavingKwh: number | null;
	energySavingPercent: number | null;
	carbonReductionTons: number | null;
	completionYear: number | null;
	documentName?: string;
	documentUrl: string | null;
	/* Delivery fields below are carried by an awarded project only: a record the vendor authored by hand has no schedule behind it. */
	status?: PortfolioProjectStatus;
	bidSubmittedAt?: string | null;
	workStartedAt?: string | null;
	targetCompletionAt?: string | null;
	/** Set only once every milestone is signed off; the last milestone's due date. */
	completedAt?: string | null;
	milestonesApproved?: number;
	milestonesTotal?: number;
	latestReportPeriod?: string | null;
	/** Summed over every reported period; null when none is reported. */
	reportedEnergySavedKwh?: number | null;
	/** Summed over every reported period; null when none is reported. */
	reportedCarbonAbatedTons?: number | null;
	/** Oldest first, as the detail chart reads them. */
	monthlyReports?: MonthlyEnergyReport[];
}

export interface VendorPerformanceMetrics {
	completionRatePercent: number; // e.g. 98%
	onTimeCompletionPercent: number; // e.g. 95%
	technicalPerformanceScore: number; // e.g. 94/100
	energySavingAchievementPercent: number; // e.g. 104% (exceeded baseline)
	carbonReductionAchievementPercent: number; // e.g. 106%
	averageProjectValue: number;
	totalCompletedProjects: number;
	historicalTrend: { period: string; score: number }[];
	bastRating?: number;
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
	/** Null when the company has not set one. */
	carbonReductionTargetTons: number | null;
	procurementMethod: ProcurementMethod;
	tenderId: number | null;
	tenderDeadlineAt: string;
	/** Null until the matching model has scored this project. */
	matchmaking: MatchmakingBreakdown | null;
	priority?: Priority;
	isSaved?: boolean;
	/** For DIRECT_SELECTION: only the invited vendor can see this project */
	invitedVendorId?: string;
	description: string;
	riskScore: number | null;
	technicalRequirements: string[];
	deliverables: string[];
}

export interface BlueprintScenario {
	key: "conservative" | "base" | "optimistic";
	label: string;
	/** Share of the planned annual saving the scenario assumes. */
	savingPct: number;
	inflationPct: number;
	degradationPct: number;
	npvAmount: number;
	irrPercent: number | null;
	paybackYears: number | null;
}

export interface BlueprintFunding {
	instrument: string;
	capexRp: number;
	tenorYears: number;
	annualSavingRp: number;
	annualRevenueRp: number | null;
	collateral: string | null;
}

export interface BlueprintEmissions {
	baselineTco2: number;
	targetPct: number;
	targetTco2: number;
	energySavingKwh: number;
}

/** The blueprint a bidder reads while the tender is open. */
export interface VendorBlueprint {
	status: string;
	validatedAt: string | null;
	irrPercent: number | null;
	npvAmount: number | null;
	paybackYears: number | null;
	funding: BlueprintFunding | null;
	emissions: BlueprintEmissions | null;
	scenarios: BlueprintScenario[];
}
