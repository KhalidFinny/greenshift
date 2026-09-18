import type { AuthUser } from "@greenshift/core";

export const apiRoutes = {
	login: { method: "POST", path: "/api/auth/login" },
	register: { method: "POST", path: "/api/auth/register" },
	me: { method: "GET", path: "/api/auth/me" },
	csrf: { method: "GET", path: "/api/auth/csrf" },
	stepUp: { method: "POST", path: "/api/auth/step-up" },
	logout: { method: "POST", path: "/api/auth/logout" },
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
} as const;

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
	items: AdminAnomaly[];
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

export interface VendorProjectListItem {
	id: number;
	title: string;
	companyName?: string | null;
	status?: string;
	industrySector: string | null;
	location: string | null;
	budget: number | null;
	riskScore?: number | null;
	tender: VendorTenderSummary | null;
	myProposalId: number | null;
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
}

export interface VendorMyProjectDetail extends VendorProjectDetail {
	proposal: ProposalDetail;
	revisions?: ProposalRevisionEntry[];
	milestones?: VendorMilestone[];
	monthlyReports?: VendorMonthlyReport[];
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
