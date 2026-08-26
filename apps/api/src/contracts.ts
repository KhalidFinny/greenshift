import type { AuthUser } from "@greenshift/core";

// Single source of truth for the HTTP API surface. The FE client derives
// from this contract, so paths, methods, and request/response shapes are
// never hardcoded in client code. Server route mounting remains in
// routes/*; this documents the client-facing endpoints.
export const apiRoutes = {
	login: { method: "POST", path: "/api/auth/login" },
	register: { method: "POST", path: "/api/auth/register" },
	me: { method: "GET", path: "/api/auth/me" },
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
}
