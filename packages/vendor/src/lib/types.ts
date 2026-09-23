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
	/** Company registration number, filed with the NPWP. */
	tdp?: string;
	/** The ESCO or ISO certificate on file, and what the scan read off it. */
	certificateName?: string;
	certificateUrl?: string;
	certificateScan?: CompanyDocumentScan | null;
	/** Why an administrator turned the profile down. */
	rejectionReason?: string;
	verifiedAt?: string;
}

/** Matching model output for one project. Scores are 0-100 and `projectRisk` is inverted, so higher is always better; the criterion wording lives in `lib/matchmaking.ts`. */
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
	/** The filed proposal PDF, as the vendor named it. Null when none is filed. */
	documentName: string | null;
	/** Where the filed document is served from, or null when none is filed. */
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
	/** Where the company marked the proposal, in the proposal page's fractions. */
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

/** One predictive-analytics period: expected consumption and savings with the accuracy metrics it was scored on.
 * Periods run forward from the last reported month, so they are directly comparable with the actuals above. */
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

/** Where the delivery of an awarded project stands, read from its milestone schedule. */
export type PortfolioProjectStatus =
	| "IN_PROGRESS"
	| "COMMISSIONING"
	| "COMPLETED";

/** Display copy for the delivery states, which are defined here, so both the card and the detail page read one vocabulary. */
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
	/** Null when the record has no figure. Never defaulted to a plausible one. */
	durationMonths: number | null;
	servicesProvided: string;
	/** Two quantities share this record type: an awarded project reports kWh/yr saved, a vendor-authored one a percentage the vendor entered. */
	energySavingKwh: number | null;
	energySavingPercent: number | null;
	carbonReductionTons: number | null;
	completionYear: number | null;
	documentName?: string;
	/** Where the filed document is served from, or null when none is filed. */
	documentUrl: string | null;
	/* Delivery fields below are carried by an awarded project only: a record the vendor authored by hand has no schedule behind it. */
	status?: PortfolioProjectStatus;
	/** When the winning bid was filed. */
	bidSubmittedAt?: string | null;
	/** Start date of the first milestone in the schedule. */
	workStartedAt?: string | null;
	/** Due date of the last milestone in the schedule. */
	targetCompletionAt?: string | null;
	/** The last milestone's due date, set only once every milestone is approved or completed. */
	completedAt?: string | null;
	milestonesApproved?: number;
	milestonesTotal?: number;
	/** The most recent MRV period reported, e.g. "2026-08". */
	latestReportPeriod?: string | null;
	/** kWh summed over every reported period; null when nothing is reported. */
	reportedEnergySavedKwh?: number | null;
	/** tCO₂e summed over every reported period; null when nothing is reported. */
	reportedCarbonAbatedTons?: number | null;
	/** Reported MRV periods, oldest first, as the detail chart reads them. Empty when none is reported. */
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
	/** Tonnes of CO2e the project targets; null when the company has not set one. */
	carbonReductionTargetTons: number | null;
	procurementMethod: ProcurementMethod;
	/** The tender a bid is filed against. Null when the project has no tender. */
	tenderId: number | null;
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

/** One of the three scenarios the blueprint's financial projections carry. */
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

/** How the project is funded: the bond the blueprint hands to the partner. */
export interface BlueprintFunding {
	instrument: string;
	capexRp: number;
	tenorYears: number;
	annualSavingRp: number;
	annualRevenueRp: number | null;
	collateral: string | null;
}

/** What the project promises to cut, against the measured baseline. */
export interface BlueprintEmissions {
	baselineTco2: number;
	targetPct: number;
	targetTco2: number;
	energySavingKwh: number;
}

/** The Green Project Blueprint a bidder reads while the tender is open: the projections LVV GRK cleared, the funding structure behind them, and the emission targets the project was verified on. */
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
