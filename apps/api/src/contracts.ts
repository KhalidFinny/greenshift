import type { AuthUser } from "@greenshift/core";

export const apiRoutes = {
	login: { method: "POST", path: "/api/auth/login" },
	register: { method: "POST", path: "/api/auth/register" },
	me: { method: "GET", path: "/api/auth/me" },
	csrf: { method: "GET", path: "/api/auth/csrf" },
	stepUp: { method: "POST", path: "/api/auth/step-up" },
	logout: { method: "POST", path: "/api/auth/logout" },
	investorMarket: { method: "GET", path: "/api/investor/market" },
	investorBuyBond: { method: "POST", path: "/api/investor/bonds" },
	investorPortfolio: { method: "GET", path: "/api/investor/portfolio" },
	investorPortfolioDetail: {
		method: "GET",
		path: "/api/investor/portfolio/:id",
	},
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

export interface BuyBondBody {
	projectId: number;
	amount: number;
}

export interface BlueprintSummary {
	irr?: number;
	npv?: number;
	paybackPeriod?: number;
}

export interface MarketProject {
	id: number;
	title: string;
	industrySector: string | null;
	location: string | null;
	budget: number | null;
	riskScore: number | null;
	targetEmissionReduction: number | null;
	estimatedEnergySaving: number | null;
	funded: number;
	fundingProgress: number; // 0..1
	blueprint: BlueprintSummary;
}

export interface BondSummary {
	id: number;
	projectId: number;
	amount: number;
	roiPaid: number;
	status: string;
	bondSerialNumber: string | null;
	investedAt: string | null;
}

export interface PortfolioItem {
	investment: BondSummary;
	project: {
		id: number;
		title: string;
		status: string;
	};
	blueprint: BlueprintSummary;
}

export interface RoiPaymentSummary {
	id: number;
	amount: number;
	period: string | null;
	status: string;
	escrowTxId: string | null;
	paidAt: string | null;
}

export interface EmissionSummary {
	id: number;
	periodStart: string | null;
	periodEnd: string | null;
	emissionReduction: number | null;
	actualConsumption: number | null;
	baselineConsumption: number | null;
	anomalyFlagged: boolean | null;
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

export interface AdminUser {
	id: number;
	email: string;
	name: string;
	role: string;
	companyName: string | null;
	verifiedAt: string | null;
	vendorProfile: boolean;
	createdAt: string | null;
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

export interface AuditLogEntry {
	id: number;
	action: string;
	entityType: string | null;
	entityId: number | null;
	metadata: unknown;
	createdAt: string | null;
	userEmail: string | null;
}

export interface AdminStats {
	users: Record<string, number>;
	projects: Record<string, number>;
	investments: { total: number; sum: number; roiPaid: number };
	payments: Record<string, number>;
	usersVerified: { verified: number; unverified: number };
	companies: number;
	investorsActive: number;
	blueprints: Record<string, number>;
	funding: Array<{
		id: number;
		title: string;
		budget: number | null;
		funded: number;
		progress: number; // 0..1
	}>;
}

export type AnomalySeverity = "critical" | "high" | "medium" | "low";

export interface AdminAnomaly {
	id: string;
	category: string;
	severity: AnomalySeverity;
	title: string;
	detail: string;
	entityType: string | null;
	entityId: number | null;
	entityLabel: string | null;
	createdAt: string | null;
}

export interface AdminAnomalyResponse {
	flags: AdminAnomaly[];
	counts: {
		critical: number;
		high: number;
		medium: number;
		low: number;
		total: number;
	};
}

// ── vendor ────────────────────────────────────────────────
export interface VendorProfile {
	id: number;
	userId: number;
	companyName: string;
	description: string | null;
	certifications: string[];
	portfolio: string[];
	rating: number;
	totalProjects: number;
	verified: boolean;
	userEmail: string;
	userName: string;
	createdAt: string | null;
}

export interface VendorProfileBody {
	companyName: string;
	description?: string;
	certifications?: string[];
	portfolio?: string[];
}

export interface VendorTenderSummary {
	id: number;
	method: string;
	status: string;
	budgetMin: number | null;
	budgetMax: number | null;
	deadlineAt: string | null;
	awardedProposalId: number | null;
}

export interface VendorProjectListItem {
	id: number;
	title: string;
	companyName: string;
	industrySector: string | null;
	location: string | null;
	budget: number | null;
	status: string;
	tender: VendorTenderSummary;
	myProposalId: number | null;
}

export interface VendorProjectDetail {
	id: number;
	title: string;
	description: string | null;
	companyName: string;
	industrySector: string | null;
	location: string | null;
	budget: number | null;
	status: string;
	targetEmissionReduction: number | null;
	estimatedEnergySaving: number | null;
	riskScore: number | null;
	tender: VendorTenderSummary | null;
	blueprint: BlueprintSummary;
	canSubmit: boolean;
}

export interface VendorMyProject {
	project: {
		id: number;
		title: string;
		status: string;
		companyName: string;
		location: string | null;
		industrySector: string | null;
		budget: number | null;
	};
	tender: VendorTenderSummary;
	proposal: {
		id: number;
		amount: number;
		status: string;
		revisionCount: number;
		submittedAt: string | null;
	};
}

export interface VendorProposalSummary {
	id: number;
	amount: number;
	technicalSpec: string | null;
	operationalCost: number | null;
	projectedRoi: number | null;
	warrantyPeriod: number | null;
	status: string;
	revisionCount: number;
	submittedAt: string | null;
	reviewedAt: string | null;
}

export interface VendorMyProjectDetail {
	id: number;
	title: string;
	description: string | null;
	status: string;
	companyName: string;
	location: string | null;
	industrySector: string | null;
	budget: number | null;
	tender: VendorTenderSummary;
	proposal: VendorProposalSummary;
	revisions: ProposalRevisionEntry[];
}

export interface VendorProcurementStatusItem {
	proposalId: number;
	proposalStatus: string;
	revisionCount: number;
	submittedAt: string | null;
	reviewedAt: string | null;
	amount: number;
	tenderId: number;
	tenderStatus: string;
	tenderDeadlineAt: string | null;
	projectId: number;
	projectTitle: string;
	companyName: string;
	latestNote: string | null;
}

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

export interface ProposalSummary {
	id: number;
	tenderId: number;
	projectId: number;
	projectTitle: string;
	amount: number;
	status: string;
	revisionCount: number;
	submittedAt: string | null;
	tenderStatus: string;
	tenderDeadlineAt: string | null;
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

export interface ProposalDetail {
	id: number;
	amount: number;
	technicalSpec: string | null;
	operationalCost: number | null;
	projectedRoi: number | null;
	warrantyPeriod: number | null;
	status: string;
	revisionCount: number;
	submittedAt: string | null;
	reviewedAt: string | null;
	tender: VendorTenderSummary;
	project: {
		id: number;
		title: string;
		description: string | null;
		status: string;
		companyName: string;
		location: string | null;
		industrySector: string | null;
		budget: number | null;
	};
	revisions: ProposalRevisionEntry[];
}
