import type { AuthUser } from "@greenshift/core";

/** Every error code the API can return, for client-side branching. */
export type { ApiErrorCode } from "./lib/response";

export const apiRoutes = {
	login: { method: "POST", path: "/api/auth/login" },
	register: { method: "POST", path: "/api/auth/register" },
	me: { method: "GET", path: "/api/auth/me" },
	csrf: { method: "GET", path: "/api/auth/csrf" },
	stepUp: { method: "POST", path: "/api/auth/step-up" },
	logout: { method: "POST", path: "/api/auth/logout" },
	accountAvatar: { method: "GET", path: "/api/account/avatar" },
	accountAvatarUpload: { method: "PUT", path: "/api/account/avatar" },
	accountAvatarDelete: { method: "DELETE", path: "/api/account/avatar" },
	investorMarket: { method: "GET", path: "/api/investor/market" },
	adminUsers: { method: "GET", path: "/api/admin/users" },
	adminVerifyUser: {
		method: "PATCH",
		path: "/api/admin/users/:id/verify",
	},
	adminProjects: { method: "GET", path: "/api/admin/projects" },
	adminProjectStatus: {
		method: "PATCH",
		path: "/api/admin/projects/:id/status",
	},
	adminBlueprints: { method: "GET", path: "/api/admin/blueprints" },
	adminBlueprintStatus: {
		method: "PATCH",
		path: "/api/admin/blueprints/:id",
	},
	adminInvestments: { method: "GET", path: "/api/admin/investments" },
	adminRoiPayments: { method: "GET", path: "/api/admin/roi-payments" },
	adminPayout: {
		method: "POST",
		path: "/api/admin/roi-payments/:id/payout",
	},
	adminAuditLogs: { method: "GET", path: "/api/admin/audit-logs" },
	adminStats: { method: "GET", path: "/api/admin/stats" },
	adminAnalytics: { method: "GET", path: "/api/admin/analytics" },
	adminAnomalies: { method: "GET", path: "/api/admin/anomalies" },
	adminVendors: { method: "GET", path: "/api/admin/vendors" },
	adminVerifyVendor: {
		method: "PATCH",
		path: "/api/admin/vendors/:id/verify",
	},
	adminBrokers: { method: "GET", path: "/api/admin/brokers" },
	adminVerifyBroker: {
		method: "PATCH",
		path: "/api/admin/brokers/:id/verify",
	},
	brokerProfile: { method: "GET", path: "/api/broker/profile" },
	brokerSaveProfile: { method: "PUT", path: "/api/broker/profile" },
	brokerProjects: { method: "GET", path: "/api/broker/projects" },
	brokerProjectRespond: {
		method: "POST",
		path: "/api/broker/projects/:id/response",
	},
	brokerProjectStatus: {
		method: "PATCH",
		path: "/api/broker/projects/:id/status",
	},
	brokerProjectBond: {
		method: "PATCH",
		path: "/api/broker/projects/:id/bond",
	},
	brokerDocumentRequests: {
		method: "GET",
		path: "/api/broker/document-requests",
	},
	brokerCreateDocumentRequest: {
		method: "POST",
		path: "/api/broker/document-requests",
	},
	brokerReviewDocument: {
		method: "PATCH",
		path: "/api/broker/document-requests/:id",
	},
	brokerReports: { method: "GET", path: "/api/broker/reports" },
	brokerReport: { method: "GET", path: "/api/broker/reports/:id" },
	brokerReportPdf: { method: "GET", path: "/api/broker/reports/:id/pdf" },
	brokerNotifications: {
		method: "GET",
		path: "/api/broker/notifications",
	},
	brokerReadNotification: {
		method: "PATCH",
		path: "/api/broker/notifications/:id",
	},
	vendorProjects: { method: "GET", path: "/api/vendor/projects" },
	vendorProjectDetail: {
		method: "GET",
		path: "/api/vendor/projects/:id",
	},
	vendorMyProjects: { method: "GET", path: "/api/vendor/my-projects" },
	vendorMyProjectDetail: {
		method: "GET",
		path: "/api/vendor/my-projects/:id",
	},
	vendorProcurementStatus: {
		method: "GET",
		path: "/api/vendor/procurement-status",
	},
	vendorProfile: { method: "GET", path: "/api/vendor/profile" },
	vendorSaveProfile: { method: "PUT", path: "/api/vendor/profile" },
	vendorProposals: { method: "GET", path: "/api/vendor/proposals" },
	vendorSubmitProposal: { method: "POST", path: "/api/vendor/proposals" },
	vendorProposalDetail: {
		method: "GET",
		path: "/api/vendor/proposals/:id",
	},
	vendorUpdateProposal: {
		method: "PATCH",
		path: "/api/vendor/proposals/:id",
	},
	vendorWithdrawProposal: {
		method: "DELETE",
		path: "/api/vendor/proposals/:id",
	},
	vendorNotifications: {
		method: "GET",
		path: "/api/vendor/notifications",
	},
	vendorReadNotification: {
		method: "PATCH",
		path: "/api/vendor/notifications/:id",
	},
	vendorNegotiations: { method: "GET", path: "/api/vendor/negotiations" },
	vendorRespondNegotiation: {
		method: "POST",
		path: "/api/vendor/negotiations/:id/response",
	},
	vendorLeaderboard: { method: "GET", path: "/api/vendor/leaderboard" },
	vendorPortfolio: { method: "GET", path: "/api/vendor/portfolio" },
	vendorAddPortfolioItem: {
		method: "POST",
		path: "/api/vendor/portfolio",
	},
	vendorDeletePortfolioItem: {
		method: "DELETE",
		path: "/api/vendor/portfolio/:id",
	},
	vendorAddMilestoneEvidence: {
		method: "POST",
		path: "/api/vendor/milestones/:id/evidence",
	},
	health: { method: "GET", path: "/api/health" },

	// ── business role (wizard -> project submission) ────────
	businessDraft: { method: "PUT", path: "/api/business/drafts/:draftId" },
	businessDraftResume: {
		method: "GET",
		path: "/api/business/drafts/:draftId",
	},
	businessUploadDocument: {
		method: "POST",
		path: "/api/business/drafts/:draftId/documents",
	},
	businessDeleteDocument: {
		method: "DELETE",
		path: "/api/business/drafts/:draftId/documents/:docId",
	},
	// Creates a project while consuming a draft and scoring it, so it reads as
	// an action rather than a plain collection POST.
	businessSubmit: { method: "POST", path: "/api/business/projects/submit" },
	businessMatchmaking: { method: "GET", path: "/api/business/matchmaking" },
	businessMatchmakingDetail: {
		method: "GET",
		path: "/api/business/matchmaking/:projectId",
	},
	businessMatchmakingMatching: {
		method: "POST",
		path: "/api/business/matchmaking/:projectId/matching",
	},
	businessMatchmakingSelection: {
		method: "POST",
		path: "/api/business/matchmaking/:projectId/selection",
	},
	businessTenderClose: {
		method: "PATCH",
		path: "/api/business/procurement/:projectId/tender",
	},
	businessTenderAward: {
		method: "POST",
		path: "/api/business/procurement/:projectId/award",
	},
	businessBidReview: {
		method: "POST",
		path: "/api/business/procurement/:projectId/proposals/:proposalId/review",
	},
	businessNotifications: {
		method: "GET",
		path: "/api/business/notifications",
	},
	businessReadNotification: {
		method: "PATCH",
		path: "/api/business/notifications/:id",
	},
	businessProjects: { method: "GET", path: "/api/business/projects" },
	businessProject: {
		method: "GET",
		path: "/api/business/projects/:id",
	},
	businessProjectRisk: {
		method: "GET",
		path: "/api/business/projects/:id/risk",
	},
	businessRiskInsight: {
		method: "POST",
		path: "/api/business/risk/insight",
	},
	businessProjectReading: {
		method: "POST",
		path: "/api/business/review/reading",
	},
	businessProjectDocuments: {
		method: "GET",
		path: "/api/business/projects/:id/documents",
	},
	businessDownloadDocument: {
		method: "GET",
		path: "/api/business/projects/:id/documents/:docId/download",
	},
} as const;

/** Read-only binding probes behind `GET /api/health`. */
export interface HealthResponse {
	status: "ok" | "degraded";
	checks: Record<string, { status: "ok" | "error" }>;
	timestamp: string;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface RegisterBody {
	name: string;
	email: string;
	password: string;
	companyName: string;
}

export interface AuthResponse {
	user: AuthUser;
}

export interface CsrfResponse {
	csrfToken: string;
	stepUpUntil: string | null;
}

export interface StepUpBody {
	password: string;
}

export interface StepUpResponse {
	ok: true;
	elevatedUntil: string;
}

export interface OkResponse {
	ok: true;
}

/**
 * Upload constraints for the account picture, shared with the client so both
 * sides reject the same files.
 */
export const avatarLimits = {
	maxBytes: 2 * 1024 * 1024,
	mimeTypes: ["image/png", "image/jpeg", "image/webp"] as const,
};

export interface BlueprintSummary {
	irr?: number;
	npv?: number;
	paybackPeriod?: number;
}

/**
 * Listing lifecycle on the public bond dashboard.
 *
 * `verified` mirrors an OJK-cleared bond that brokers can list; `on_progress`
 * is everything still working through assessment/audit. GreenShift never
 * settles a trade: verified listings hand off to a broker app via Trima+.
 */
export const bondStatuses = ["verified", "on_progress"] as const;
export type BondStatus = (typeof bondStatuses)[number];

/** A single bond listing shown on the public bond dashboard. */
export interface BondListing {
	id: number;
	title: string;
	/** Broker-facing code investors search for in Trima+/IPOT. */
	bondCode: string | null;
	companyName: string | null;
	industrySector: string | null;
	location: string | null;
	/** Issuance amount (project budget), in IDR. */
	budget: number | null;
	riskScore: number | null;
	targetEmissionReduction: number | null;
	estimatedEnergySaving: number | null;
	funded: number;
	fundingProgress: number;
	status: BondStatus;
	/** When the listing became verified; drives the date shown on the card. */
	verifiedAt: string | null;
	blueprint: BlueprintSummary;
}

export interface BondMarketResponse {
	bonds: BondListing[];
}

export interface VerifyUserBody {
	verified: boolean;
}

export interface AdminVendor {
	id: number;
	userId: number;
	email: string;
	userName: string;
	companyName: string;
	description: string | null;
	certifications: string[];
	portfolio: string[];
	rating: number;
	totalProjects: number;
	verifiedAt: string | null;
	createdAt: string | null;
}

export interface VerifyVendorBody {
	verified: boolean;
}

export interface UpdateStatusBody {
	status: string;
}

export interface BlueprintUpdateBody {
	status: string;
	auditNote?: string;
}

export interface AuditLogEntry {
	id: number;
	action: string;
	entityType: string | null;
	entityId: number | null;
	projectId?: number | null;
	userId?: number | null;
	userEmail?: string | null;
	metadata: unknown;
	createdAt: string | null;
}

export interface AdminUser {
	id: number;
	email: string;
	role: string;
	name: string;
	companyName: string | null;
	verifiedAt: string | null;
	createdAt: string | null;
	vendorProfile: boolean;
}

export interface AdminProject {
	id: number;
	title: string;
	status: string;
	companyName: string;
	industrySector: string | null;
	budget: number | null;
	riskScore: number | null;
	blueprintStatus: string | null;
}

export interface AdminBlueprint {
	id: number;
	projectId: number;
	projectTitle: string;
	status: string;
	auditorId?: number | null;
	auditNote: string | null;
	validatedAt: string | null;
	publishedAt: string | null;
}

export interface AdminInvestment {
	id: number;
	investorName: string;
	investorEmail: string;
	projectTitle: string;
	amount: number;
	roiPaid: number;
	status: string;
	bondSerialNumber: string | null;
	investedAt: string | null;
}

export interface AdminRoiPayment {
	id: number;
	investmentId: number;
	investorEmail: string;
	projectTitle: string;
	period: string | null;
	amount: number;
	status: string;
	escrowTxId: string | null;
	paidAt: string | null;
}

export interface AdminAnomaly {
	id?: string | number;
	code: string;
	severity: "critical" | "high" | "medium" | "low";
	category: string;
	title: string;
	description: string;
	detail?: string;
	entityLabel?: string | null;
	projectId: number | null;
	entityType: string | null;
	entityId: number | null;
	createdAt?: string | null;
}

export interface AdminAnomalyResponse {
	flags: AdminAnomaly[];
	counts: Record<AdminAnomaly["severity"] | "total", number>;
}

/**
 * One month of the platform-wide series behind `GET /api/admin/analytics`.
 *
 * Every figure is an aggregate over rows the platform actually holds; a month
 * with no activity is reported as zeroes rather than omitted, so the charts keep
 * an even x-axis.
 */
export interface AdminAnalyticsPoint {
	/** Calendar month in UTC, `YYYY-MM`. */
	month: string;
	/** Accounts registered in the month. */
	users: number;
	/** Of those, accounts that carry a company name. */
	organizations: number;
	/** Projects submitted in the month. */
	projects: number;
	/** Bond money taken in during the month. */
	investments: number;
	/** ROI paid out during the month. */
	roiPaid: number;
	/** Tonnes of CO2e measured by the MRV reports that closed in the month. */
	carbonReduction: number;
}

export interface AdminAnalytics {
	/** The trailing 12 months, oldest first. */
	monthly: AdminAnalyticsPoint[];
	totals: {
		users: number;
		organizations: number;
		projects: number;
		investments: number;
		roiPaid: number;
		carbonReduction: number;
		/** Tonnes of CO2e the submitted projects target in total. */
		carbonReductionTarget: number;
	};
}

export interface AdminStats {
	users: Record<string, number>;
	usersVerified?: number | { verified: number; unverified: number };
	projects: Record<string, number>;
	investments: {
		total: number;
		sum: number;
		roiPaid: number;
	};
	companies: number;
	investorsActive: number;
	blueprints: Record<string, number>;
	funding: Array<{
		id: number;
		title: string;
		budget: number | null;
		funded: number;
		progress?: number;
	}>;
	payments: Record<string, number>;
}

export interface VendorProfileBody {
	companyName: string;
	description: string;
	certifications: string[];
	portfolio: string[];
}

export interface VendorProfile {
	id: number;
	userId?: number;
	userName?: string | null;
	userEmail?: string | null;
	verified?: boolean;
	companyName: string;
	description: string | null;
	certifications: string[];
	portfolio: string[];
	rating: number;
	totalProjects: number;
	verifiedAt: string | null;
	createdAt?: string | null;
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

/**
 * The five weighted criteria of the vendor matching model for one project, plus
 * its weighted total and the vendor's rank against the other bidders. Scores are
 * 0-100; `projectRisk` is scored so that a higher number means lower risk.
 */
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

export interface ProposalDraftBody {
	tenderId: number;
	amount: number;
	technicalSpec: string;
	operationalCost: number;
	projectedRoi: number;
	warrantyPeriod: number;
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
	blueprint?: BlueprintSummary;
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

/**
 * One predictive-analytics period for a project: what the model expects the
 * site to consume and save, with the accuracy metrics it was scored on.
 */
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
	status: string;
	documentName: string | null;
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
	status?: string;
	documentName?: string;
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

// ── Business role ─────────────────────────────────────────
// The wizard collects a project in three steps and submits it for LVV review.
// Every field name here is the one the frontend already uses, so neither side
// keeps a translation table.

/** Step 1: what the project is and what it is expected to save. */
export interface BusinessStep1 {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	konsumsiMwh: number;
	biayaRp: number;
	faktorEmisi: number;
	targetPct: number;
	targetMwh: number;
	timeline: string;
	ringkasan: string;
}

/** Step 2: how it is financed. `fileIds` are draft document ids. */
export interface BusinessStep2 {
	capexRp: number;
	tenorTahun: number;
	penghematanRp: number;
	pendapatanRp: number;
	jaminan: string;
	fileIds: string[];
}

/** Step 3: the document checklist, slot name to draft document id. */
export interface BusinessStep3 {
	docStates: Record<string, string | null>;
}

/**
 * A partial Step 1 or Step 2 block. On autosave an absent key means the field
 * was not touched, while an explicit `null` means it was cleared.
 */
export type BusinessStep1Patch = Partial<{
	[K in keyof BusinessStep1]: BusinessStep1[K] | null;
}>;
export type BusinessStep2Patch = Partial<{
	[K in keyof BusinessStep2]: BusinessStep2[K] | null;
}>;

/** Body of `PUT /api/business/drafts/:draftId`. Every block is optional. */
export interface BusinessDraftBody {
	step?: 1 | 2 | 3;
	step1?: BusinessStep1Patch;
	step2?: BusinessStep2Patch;
	step3?: BusinessStep3;
}

/** The stored draft, merged. Null blocks have never been touched. */
export interface BusinessDraft {
	id: string;
	step: number | null;
	updatedAt: string | null;
	step1: BusinessStep1Patch | null;
	step2: BusinessStep2Patch | null;
	step3: BusinessStep3 | null;
}

export interface BusinessDraftResponse {
	draft: BusinessDraft;
}

/**
 * A file attached to an unsubmitted draft. The upload returns it and the resume
 * returns them all, so a draft that comes back after a reload still knows the
 * files it holds: the ids inside `step2.fileIds` and `step3.docStates` name
 * files, and this is what the file names and sizes are read from.
 */
export interface BusinessDraftDocument {
	id: string;
	slot: string;
	fileName: string;
	sizeBytes: number | null;
	uploadedAt: string | null;
}

/** The draft plus its attached files, which its blocks only reference by id. */
export interface BusinessDraftResumeResponse {
	draft: BusinessDraft;
	documents: BusinessDraftDocument[];
}

/** Body of `POST /api/business/projects/submit`: every block is required. */
export interface BusinessSubmitBody {
	draftId: string;
	step1: BusinessStep1;
	step2: BusinessStep2;
	step3: BusinessStep3;
	consent: boolean;
	declaration: boolean;
}

/**
 * The submitted project, with the scores the server derived. The client never
 * computes these, so they are absent from the request body by design.
 */
export interface BusinessSubmittedProject {
	id: number;
	title: string;
	status: string;
	/** The stage in the words the app shows, e.g. "Review LVV". */
	statusLabel: string;
	submittedAt: string | null;
	/** Tonnes of CO2e per year: consumption x emission factor. */
	baselineTco2: number | null;
	creditScore: number | null;
	creditRating: string | null;
	riskScore: number | null;
	riskLevel: string | null;
}

export interface BusinessSubmitResponse {
	project: BusinessSubmittedProject;
}

/**
 * The submitted project as any surface reads it back, so the confirmation the
 * company lands on shows the same figures the submission answered with.
 */
export interface BusinessProjectResponse {
	project: BusinessSubmittedProject;
}

/** One row of the project table. `status` is the pill label, not the DB enum. */
export interface BusinessProjectSummary {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	/** "Review LVV" | "Matchmaking" | "Verified". */
	status: string;
}

export interface BusinessProjectsResponse {
	projects: BusinessProjectSummary[];
}

/**
 * The model's closed vocabularies. The frontend declares the same unions, so
 * typing them here keeps the response renderable without a cast on either side.
 */
export const riskTones = ["Low", "Medium", "High"] as const;
export type RiskTone = (typeof riskTones)[number];
export const riskLevels = ["Low", "Medium", "High"] as const;
export type RiskLevel = (typeof riskLevels)[number];

export interface BusinessRiskBreakdown {
	key: string;
	label: string;
	/** Null when the contributing input has not been provided yet. */
	tone: RiskTone | null;
	pct: number;
}

/** Mirrors the frontend `ProjectRiskResult` so it renders untouched. */
export interface BusinessRisk {
	score: number;
	level: RiskLevel;
	success: number;
	breakdown: BusinessRiskBreakdown[];
	factors: string[];
	mitigations: string[];
	summary: string;
	/**
	 * Eleanor's written reading of these figures. Stored with the assessment, so
	 * it is written once per project rather than per view, and always about the
	 * numbers it travels with.
	 */
	insight: BusinessRiskInsight;
}

/**
 * What Eleanor is given to write about: the assessment's figures, without the
 * one-line summary she is asked to expand on or the reading being replaced.
 */
export type BusinessRiskInsightBody = Omit<BusinessRisk, "summary" | "insight">;

/** Eleanor's reading. */
export interface BusinessRiskInsight {
	text: string;
	/**
	 * `ai` when Workers AI wrote it, `model` when the analyst composed it from
	 * the same figures because the binding is absent or the provider failed.
	 * Both are readings of the assessment; the source is reported so a caller
	 * can tell them apart.
	 */
	source: "ai" | "model";
}

/**
 * Body of `POST /api/business/risk/insight`: the assessment the wizard derived
 * from the form. The figures are the client's because no project row exists yet
 * to read them from; the reading is composed server-side from them either way,
 * so the wizard shows Eleanor's own words rather than a second implementation
 * of them in the browser.
 *
 * `mode` picks how much she writes: `brief` is the two or three sentences a
 * summary panel holds, `full` is the reading the detail view shows.
 */
export interface BusinessRiskInsightRequest extends BusinessRiskInsightBody {
	mode?: AnalystReadingMode;
}

export type AnalystReadingMode = "brief" | "full";

export interface BusinessRiskInsightResponse {
	insight: BusinessRiskInsight;
}

/**
 * Body of `POST /api/business/review/reading`: the project and its money as
 * Steps 1 and 2 hold them, for the summary the review step opens with. Sent
 * rather than read, for the same reason the risk insight is: the project does
 * not exist yet.
 */
export interface BusinessProjectReadingRequest {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
}

/** The reading has the same shape wherever it is written: text, and who wrote it. */
export interface BusinessProjectReadingResponse {
	reading: BusinessRiskInsight;
}

/**
 * The three procurement routes, in the vocabulary the tender stores and the
 * vendor API already speaks, so a choice needs no translation to become one.
 */
export const tenderMethodIds = ["open", "closed", "direct"] as const;
export type BusinessMatchmakingMethod = (typeof tenderMethodIds)[number];

/** A tender's life: bidding, then evaluation, then closed or awarded. */
export type BusinessTenderStatus = "open" | "evaluation" | "closed" | "awarded";

/** One company project on the matchmaking list. */
export interface BusinessMatchmakingProject {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	/** The pill label the list renders, from the API's `pillStatus`. */
	status: string;
	/** The vendor this project's tender was awarded to, or null until it is. */
	awardedVendor: string | null;
	/** The tender's state, so the list can send a decided project to its bids. */
	tenderStatus: BusinessTenderStatus | null;
}

/**
 * One criterion of the matching model: how this project's pool scores on it,
 * what it was worth, and whether it went into the total at all. A criterion the
 * whole pool scores the same on cannot separate the vendors, so the run leaves
 * it out and renormalises the rest; `weight` is the share it actually carried,
 * which is zero for the ones left out.
 */
export interface BusinessMatchFactor {
	label: string;
	pct: number;
	weight: number;
	applied: boolean;
}

/** A scored vendor for one project, with the facts its row renders. */
export interface BusinessRecommendedVendor {
	id: number;
	name: string;
	subtitle: string;
	/** Weighted total of the five criteria, 0–100. */
	score: number;
	rank: number;
	rating: number;
	totalProjects: number;
	verified: boolean;
	/**
	 * Among the best few the company is offered to choose between. A closed or
	 * direct tender invites these; an open one invites every verified vendor.
	 */
	shortlisted: boolean;
	/** This vendor's own reading on each criterion, best first. */
	criteria: Array<{ label: string; pct: number }>;
	/** Why this vendor ranks here, read off its own scores. */
	whyRank: string[];
}

export interface BusinessProcurementMethod {
	id: BusinessMatchmakingMethod;
	label: string;
	desc: string;
}

/** The tender a project is running, and the bids on it. */
export interface BusinessTender {
	id: number;
	projectId: number;
	method: BusinessMatchmakingMethod;
	status: BusinessTenderStatus;
	deadlineAt: string | null;
	budgetMin: number | null;
	budgetMax: number | null;
	awardedProposalId: number | null;
	/** How many bids are in, so a list row needs no second request. */
	bidCount: number;
	awardedVendorName: string | null;
}

/** One vendor's bid on a tender, in the fields the spec's form collects. */
export interface BusinessProcurementBid {
	id: number;
	vendorId: number;
	vendorName: string;
	amount: number;
	technicalSpec: string | null;
	operationalCost: number | null;
	projectedRoi: number | null;
	/** Months of warranty offered. */
	warrantyPeriod: number | null;
	status: string;
	revisionCount: number;
	submittedAt: string | null;
	/**
	 * How this offer scores against the others on the same tender, from the
	 * figures it states. Null when it is the only bid, because one offer cannot
	 * be compared with anything.
	 */
	score: number | null;
}

/** Everything the matchmaking detail screen renders for one project. */
export interface BusinessMatchmakingDetail {
	project: BusinessMatchmakingProject;
	matchFactors: BusinessMatchFactor[];
	procurementMethods: BusinessProcurementMethod[];
	selectedMethod: BusinessMatchmakingMethod | null;
	selectedVendorId: number | null;
	/** Every ranked vendor, best first, each marked with whether it is shortlisted. */
	recommendedVendors: BusinessRecommendedVendor[];
	/** How many verified vendors the matching run scored. */
	poolSize: number;
	/** How many of them the shortlist holds. */
	shortlistSize: number;
	/** Absent until the company's choice opens one. */
	tender: BusinessTender | null;
	bids: BusinessProcurementBid[];
}

export interface BusinessMatchmakingListResponse {
	projects: BusinessMatchmakingProject[];
}

/** What a matching run did, so the screen can say it in words. */
export interface BusinessMatchingRunResponse {
	scored: number;
	shortlist: Array<{ vendorId: number; name: string; score: number }>;
}

export interface BusinessMatchmakingSelectionBody {
	/**
	 * The vendor the company names. Required by the direct route, which is the
	 * one that appoints a single vendor up front; the open and closed routes
	 * invite their pool by their own rule, so they open without one.
	 */
	vendorId?: number;
	method: BusinessMatchmakingMethod;
	/** When bidding closes. The tender runs until this moment. */
	deadlineAt: string;
	budgetMin?: number | null;
	budgetMax?: number | null;
}

/** Closing bidding freezes the terms and puts the tender under evaluation. */
export interface BusinessTenderCloseBody {
	action: "close";
}

export interface BusinessAwardBody {
	proposalId: number;
}

export interface BusinessBidReviewBody {
	decision: "accept" | "revision" | "reject";
	/** Required when asking for a revision: the vendor is told what to change. */
	note?: string | null;
}

export interface BusinessMatchmakingSelectionResponse {
	selection: {
		projectId: number;
		/** The vendor named up front, which the open and closed routes do not name. */
		vendorId: number | null;
		vendorName: string | null;
		method: BusinessMatchmakingMethod;
	};
	tender: BusinessTender;
}

/** One row of the company feed the shell bell renders. */
export interface BusinessNotification {
	id: number;
	type: string;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

export interface BusinessRiskResponse {
	risk: BusinessRisk;
}

/** A file on a submitted project, after OCR has had it. `slot` is the checklist key it fills. */
export interface BusinessDocument {
	id: string;
	slot: string;
	fileName: string;
	ocrStatus: string | null;
	/** Null while OCR is still processing, so the UI can disable the action. */
	downloadUrl?: string | null;
}

export interface BusinessDocumentResponse {
	document: BusinessDraftDocument;
}

export interface BusinessDocumentsResponse {
	documents: BusinessDocument[];
}

// ── Broker role ───────────────────────────────────────────
// The broker prepares a verified project for bond issuance. The bond process
// itself (issuance, sale, distribution, escrow, investors) happens outside
// GreenShift and is only tracked at a high level here.

/** Verification result derived from the broker profile (§6). */
export const brokerVerificationStatuses = [
	"NOT_VERIFIED",
	"VERIFIED",
	"REJECTED",
] as const;
export type BrokerVerificationStatus =
	(typeof brokerVerificationStatuses)[number];

export interface BrokerProfile {
	id: number;
	userId: number;
	companyName: string;
	description: string | null;
	representative: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	website: string | null;
	address: string | null;
	nib: string | null;
	financialLicenseNumber: string | null;
	licenseAuthority: string | null;
	verificationStatus: BrokerVerificationStatus;
	submittedAt: string | null;
	verifiedAt: string | null;
	rejectionReason: string | null;
}

export interface BrokerProfileBody {
	companyName: string;
	description?: string;
	representative?: string;
	contactEmail?: string;
	contactPhone?: string;
	website?: string;
	address?: string;
	nib?: string;
	financialLicenseNumber?: string;
	licenseAuthority?: string;
}

export interface BrokerRiskAssessment {
	overallRiskLevel: string | null;
	financialRisk: string | null;
	technicalRisk: string | null;
	implementationRisk: string | null;
	environmentalRisk: string | null;
	notes: string | null;
}

export interface BrokerBondInfo {
	status: string;
	bondSerialNumber: string | null;
	totalAmount: number;
	tenorMonths: number | null;
	couponRatePercent: number | null;
	issuanceDate: string | null;
	maturityDate: string | null;
	brokerRepresentative: string | null;
}

export interface BrokerFinancialProjections {
	irrPercent: number | null;
	npvAmount: number | null;
	paybackYears: number | null;
}

export interface BrokerProjectDocument {
	id: number;
	type: string;
	fileName: string;
	fileUrl: string | null;
	uploadedAt: string;
}

export interface BrokerMilestone {
	id: number;
	stepNumber: number;
	title: string;
	status: string;
	completionPercent: number | null;
	startDate: string | null;
	dueDate: string | null;
}

/** A project the Company assigned to this Broker (§11). */
export interface BrokerAssignedProject {
	id: number;
	title: string;
	companyName: string;
	companyEmail: string;
	vendorName: string | null;
	industrySector: string | null;
	location: string | null;
	projectValue: number;
	lvvGrkStatus: "VERIFIED" | "PENDING";
	lvvGrkVerificationDate: string | null;
	blueprintStatus: string | null;
	workflowStatus: string;
	riskAssessment: BrokerRiskAssessment;
	bondInfo: BrokerBondInfo;
	financialProjections: BrokerFinancialProjections;
	assignedAt: string;
	isAccepted: boolean;
	declineReason: string | null;
	informationRequest: string | null;
	outstandingRequestsCount: number;
	lastReportDate: string | null;
	description: string | null;
	documents: BrokerProjectDocument[];
	milestones: BrokerMilestone[];
}

/** Assignment decision (§21): accept, ask for information, or decline with a reason. */
export interface BrokerAssignmentResponseBody {
	action: "ACCEPT" | "DECLINE" | "REQUEST_INFORMATION";
	reason?: string;
	message?: string;
}

export interface BrokerProjectStatusBody {
	status: string;
}

export interface BrokerBondUpdateBody {
	status: string;
	serialNumber?: string;
	amount?: number;
	tenorMonths?: number;
	couponRatePercent?: number;
	issuanceDate?: string;
	maturityDate?: string;
}

export interface BrokerDocumentRequest {
	id: number;
	projectId: number;
	projectTitle: string;
	companyName: string;
	category: string;
	documentTypeName: string;
	requiredPeriod: string | null;
	reason: string;
	deadlineDate: string | null;
	additionalNotes: string | null;
	status: string;
	submittedFileName: string | null;
	submittedFileUrl: string | null;
	submittedAt: string | null;
	rejectionReason: string | null;
	reviewedAt: string | null;
}

export interface BrokerDocumentRequestBody {
	projectId: number;
	category: string;
	documentTypeName: string;
	reason: string;
	deadlineDate: string;
	requiredPeriod?: string;
	additionalNotes?: string;
}

export interface BrokerDocumentReviewBody {
	action: "START_REVIEW" | "APPROVE" | "REJECT";
	reason?: string;
}

/**
 * Official monthly monitoring report as delivered to the Broker (§30-§34).
 * Progress comes from the project's milestones, energy and carbon from the
 * MRV report of the period, the remaining figures from the published report.
 */
export interface BrokerMonthlyReport {
	id: number;
	projectId: number;
	projectTitle: string;
	companyName: string;
	vendorName: string | null;
	period: string;
	overallStatus: string;
	plannedProgressPercent: number;
	actualProgressPercent: number;
	completedMilestonesCount: number;
	currentMilestoneTitle: string | null;
	plannedBudgetAmount: number;
	actualSpendingAmount: number;
	expectedEnergySavingsKwh: number;
	actualEnergySavingsKwh: number;
	expectedCarbonReductionTons: number;
	actualCarbonReductionTons: number;
	projectedRoiPercent: number;
	actualRoiPerformancePercent: number;
	detectedRisksOrAnomalies: string[];
	overallConclusion: string;
	submittedAt: string;
	pdfPath: string;
}

export interface BrokerNotification {
	id: number;
	category: string;
	title: string;
	message: string | null;
	createdAt: string;
	isRead: boolean;
	linkUrl: string | null;
}

export interface AdminBroker {
	id: number;
	userId: number;
	companyName: string;
	representative: string | null;
	email: string;
	nib: string | null;
	financialLicenseNumber: string | null;
	licenseAuthority: string | null;
	submittedAt: string | null;
	verifiedAt: string | null;
	rejectionReason: string | null;
}

export interface VerifyBrokerBody {
	verified: boolean;
	rejectionReason?: string;
}
