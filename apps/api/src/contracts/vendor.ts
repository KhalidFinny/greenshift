import type { ProposalAnnotation } from "./business-procurement";
import type { ProjectBlueprintView } from "./market";
import type { CompanyDocumentScan } from "./verification";

/** A partial update: omitted keys keep their stored value. */
export interface VendorProfileBody {
	companyName: string;
	description?: string;
	serviceCategory?: string;
	location?: string;
	nib?: string;
	npwp?: string;
	/** Company registration number, filed with the NPWP. */
	tdp?: string;
	certifications?: string[];
	portfolio?: string[];
}

export interface VendorProfile {
	id: number;
	userId?: number;
	userName?: string | null;
	userEmail?: string | null;
	verified?: boolean;
	companyName: string;
	description: string | null;
	serviceCategory: string | null;
	location: string | null;
	nib: string | null;
	npwp: string | null;
	tdp: string | null;
	certifications: string[];
	portfolio: string[];
	rating: number;
	totalProjects: number;
	verifiedAt: string | null;
	createdAt?: string | null;
	/** The ESCO or ISO certificate the vendor filed, and where it is served from. */
	certificateName: string | null;
	certificateUrl: string | null;
	certificateScan: CompanyDocumentScan | null;
	rejectionReason: string | null;
}

export interface VendorTenderSummary {
	id: number;
	method: string;
	status: string;
	budgetMin: number | null;
	budgetMax: number | null;
	deadlineAt: string | null;
	awardedProposalId?: number | null;
}

/** Five weighted criteria, 0-100; a higher `projectRisk` is lower risk. */
export interface VendorMatchScore {
	technicalFit: number;
	relevantExperience: number;
	historicalPerformance: number;
	priceValue: number;
	projectRisk: number;
	totalScore: number;
	/** Position among the vendors scored for this project, 1 = best. */
	rank: number;
}

export interface VendorProjectListItem {
	id: number;
	title: string;
	description: string | null;
	companyName?: string | null;
	status?: string;
	industrySector: string | null;
	location: string | null;
	budget: number | null;
	riskScore?: number | null;
	/** Tonnes of CO2e the project targets, from the project parameters. */
	carbonReductionTargetTons: number | null;
	technicalRequirements: string[];
	deliverables: string[];
	tender: VendorTenderSummary | null;
	myProposalId: number | null;
	/** Null when the matching model has not scored this project for the caller. */
	matchScore: VendorMatchScore | null;
}

export interface ProposalSummary {
	id: number;
	tenderId?: number;
	projectId?: number;
	projectTitle?: string;
	vendorCompanyName?: string;
	tenderStatus?: string | null;
	tenderDeadlineAt?: string | null;
	amount: number;
	status: string;
	revisionCount: number;
	/** The proposal PDF the vendor filed, and where it is served from. */
	documentName: string | null;
	documentUrl: string | null;
	submittedAt: string | null;
}

export interface ProposalRevisionEntry {
	id: number;
	revisionNumber: number;
	note: string | null;
	amount: number | null;
	previousAmount: number | null;
	createdBy: string | null;
	createdAt: string | null;
}

export interface ProposalDetail extends ProposalSummary {
	technicalSpec: string | null;
	operationalCost: number | null;
	projectedRoi: number | null;
	warrantyPeriod: number | null;
	/** The filed proposal PDF, as the vendor named it. Null when none is filed. */
	documentName: string | null;
	/** Where the filed document is served from, or null when none is filed. */
	documentUrl: string | null;
	reviewedAt: string | null;
	revisions?: ProposalRevisionEntry[];
	tender?: VendorTenderSummary | null;
	project?: {
		id: number;
		title: string;
		description?: string | null;
		status?: string;
		location?: string | null;
		industrySector?: string | null;
		budget?: number | null;
		companyName?: string | null;
	} | null;
}

/** Multipart fields: absent stays absent; the document is the one required part. */
export interface ProposalDraftBody {
	tenderId: number;
	amount: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
}

export interface ProposalUpdateBody {
	amount?: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
	note?: string;
}

export interface VendorProjectDetail {
	id: number;
	title: string;
	companyName?: string | null;
	description: string | null;
	status: string;
	budget: number | null;
	location: string | null;
	industrySector: string | null;
	targetEmissionReduction?: number | null;
	estimatedEnergySaving?: number | null;
	riskScore?: number | null;
	tender: VendorTenderSummary | null;
	/** The scope of work the tender is bid against. */
	technicalRequirements?: string[];
	deliverables?: string[];
	/** The validated blueprint, shown to bidders once LVV GRK has cleared it. */
	blueprint?: ProjectBlueprintView | null;
	canSubmit?: boolean;
}

export interface VendorMyProject {
	proposal: ProposalSummary;
	project: {
		id: number;
		title: string;
		status: string;
		companyName?: string | null;
		location?: string | null;
		industrySector?: string | null;
		budget?: number | null;
		targetEmissionReduction?: number | null;
		estimatedEnergySaving?: number | null;
	};
	tender: VendorTenderSummary | null;
	milestones?: VendorMilestone[];
	monthlyReports?: VendorMonthlyReport[];
	forecasts?: VendorEnergyForecast[];
}

/** Expected consumption and savings, with the accuracy metrics it was scored on. */
export interface VendorEnergyForecast {
	periodStart: string | null;
	periodEnd: string | null;
	/** kWh the model expects the site to consume over the period. */
	forecastedConsumption: number | null;
	/** kWh the model expects to be saved against the baseline. */
	forecastedSavings: number | null;
	modelName: string | null;
	/** Held-out accuracy metrics; absent when the model was not scored. */
	metrics: {
		mae?: number;
		rmse?: number;
		r2?: number;
		cvRmse?: number;
	} | null;
}

export interface VendorMyProjectDetail extends VendorProjectDetail {
	proposal: ProposalDetail;
	revisions?: ProposalRevisionEntry[];
	milestones?: VendorMilestone[];
	monthlyReports?: VendorMonthlyReport[];
	forecasts?: VendorEnergyForecast[];
}

export interface VendorNotification {
	id: number;
	type: string;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

export interface VendorNegotiation {
	id: number;
	proposalId: number;
	projectId: number | null;
	projectTitle: string;
	companyName: string | null;
	iterationNumber: number;
	maxIterations: number;
	status: string;
	requestedPriceReduction: number | null;
	requestedWarrantyYears: number | null;
	requestedTimelineMonths: number | null;
	requestedFields: string[];
	companyNote: string;
	/** Where the company marked the proposal, over the document they both read. */
	annotations: ProposalAnnotation[];
	vendorRevisedPrice: number | null;
	vendorRevisedWarrantyYears: number | null;
	vendorRevisedTimelineMonths: number | null;
	vendorResponseNote: string | null;
	respondedAt: string | null;
	updatedAt: string;
}

export interface VendorNegotiationResponseBody {
	revisedPrice?: number;
	revisedWarrantyYears?: number;
	revisedTimelineMonths?: number;
	note?: string;
}

export interface VendorLeaderboardEntry {
	rank: number;
	proposalId: number;
	vendorName: string;
	isCurrentVendor: boolean;
	amount: number;
	updatedAt: string;
}

/** Ranking of the open-bid tender the vendor is currently bidding on. */
export interface VendorLeaderboardResponse {
	tender: {
		id: number;
		projectId: number;
		projectTitle: string;
		method: string;
		status: string;
		deadlineAt: string | null;
		budgetMax: number | null;
	} | null;
	myProposalId: number | null;
	myAmount: number | null;
	myRank: number | null;
	entries: VendorLeaderboardEntry[];
}

export interface VendorMilestoneEvidence {
	id: number;
	kind: string;
	fileName: string;
	fileUrl: string | null;
	notes: string | null;
	uploadedAt: string;
}

export interface VendorMilestone {
	id: number;
	stepNumber: number;
	title: string;
	description: string | null;
	startDate: string | null;
	dueDate: string | null;
	completionPercent: number | null;
	status: string;
	vendorNotes: string | null;
	companyReviewNotes: string | null;
	evidence: VendorMilestoneEvidence[];
}

export interface VendorMonthlyReport {
	id: number;
	projectId: number;
	period: string; // "2026-08"
	periodStart: string | null;
	periodEnd: string | null;
	actualConsumption: number | null;
	baselineConsumption: number | null;
	energySavedKwh: number | null;
	carbonSavedTons: number | null;
	evidenceDocs: string[];
	submittedAt: string;
}

export interface VendorPortfolioItem {
	id: number;
	projectName: string;
	clientName: string;
	projectType: string | null;
	location: string | null;
	description: string | null;
	projectValue: number;
	durationMonths: number | null;
	servicesProvided: string | null;
	energySavingPercent: number | null;
	carbonReductionTons: number | null;
	completionYear: number | null;
	documentName: string | null;
	/** Null when the record carries no file. A URL rather than a key: the caller only opens it. */
	documentUrl: string | null;
}

export interface VendorPortfolioBody {
	projectName: string;
	clientName: string;
	projectType?: string;
	location?: string;
	description?: string;
	projectValue: number;
	durationMonths?: number;
	servicesProvided?: string;
	energySavingPercent?: number;
	carbonReductionTons?: number;
	completionYear?: number;
}

export interface VendorProcurementStatusItem {
	id?: number;
	proposalId?: number;
	projectId: number;
	projectTitle: string;
	status?: string;
	proposalStatus?: string;
	revisionCount: number;
	latestNote: string | null;
	deadlineAt?: string | null;
	tenderDeadlineAt?: string | null;
	tenderId?: number;
	tenderStatus?: string;
	submittedAt?: string | null;
	reviewedAt?: string | null;
	amount?: number;
	companyName?: string;
}
