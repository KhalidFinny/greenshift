export type VerificationStatus =
	| "NOT_VERIFIED"
	| "VERIFYING"
	| "VERIFIED"
	| "REJECTED";

export interface CompanyVerificationDetails {
	status: VerificationStatus;
	nib?: string;
	npwp?: string;
	legalDocUrl?: string;
	escoCertificationUrl?: string;
	isoCertificationUrl?: string;
	rejectionReason?: string;
	submittedAt?: string;
	verifiedAt?: string;
}

export interface MatchmakingBreakdown {
	technicalFit: number; // 0-100
	technicalFitExplanation: string;
	relevantExperience: number; // 0-100
	relevantExperienceExplanation: string;
	historicalPerformance: number; // 0-100
	historicalPerformanceExplanation: string;
	priceAndValue: number; // 0-100
	priceAndValueExplanation: string;
	projectRisk: number; // 0-100
	projectRiskExplanation: string;
	overallMatch: number; // 0-100
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
	equipmentCost: number;
	installationCost: number;
	laborCost: number;
	operationalCost: number;
	otherCost: number;
	totalPrice: number;
}

export interface ExpectedImpact {
	energySavingsPercent: number; // e.g. 22%
	carbonReductionTons: number; // e.g. 150 tCO2e/yr
	projectedRoiPercent: number; // e.g. 14.5%
}

export interface StructuredProposal {
	id: string;
	projectId: string;
	projectTitle: string;
	companyName: string;
	procurementMethod: ProcurementMethod;
	status: ProposalStatus;
	executiveSummary: string;
	technicalSolution: string;
	equipmentSpecs: string;
	includedScope: string;
	excludedScope: string;
	estimatedStartDate: string;
	estimatedDurationMonths: number;
	costBreakdown: CostBreakdown;
	expectedImpact: ExpectedImpact;
	warrantyYears: number;
	warrantyCoverage: string;
	pdfDocumentName?: string;
	submittedAt?: string;
	revisionCount: number;
}

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

export interface ActiveVendorProject {
	id: string;
	title: string;
	companyName: string;
	industrySector: string;
	location: string;
	agreedBudget: number;
	overallProgressPercent: number;
	currentMilestoneTitle: string;
	deadlineDate: string;
	status: "IN_PROGRESS" | "COMMISSIONING" | "COMPLETED";
	milestones: ProjectMilestone[];
	monthlyReports: MonthlyEnergyReport[];
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
	durationMonths: number;
	servicesProvided: string;
	energySavingPercent: number;
	carbonReductionTons: number;
	completionYear: number;
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
	carbonReductionTargetTons: number;
	procurementMethod: ProcurementMethod;
	tenderDeadlineAt: string;
	matchmaking: MatchmakingBreakdown;
	isSaved?: boolean;
	/** For DIRECT_SELECTION: only the invited vendor can see this project */
	invitedVendorId?: string;
	description: string;
	riskScore: number;
	technicalRequirements: string[];
	deliverables: string[];
}
