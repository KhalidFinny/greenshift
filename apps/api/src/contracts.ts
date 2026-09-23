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
	/** Multipart: the proposal document is a file, not a JSON body. */
	vendorProposalDocument: {
		method: "POST",
		path: "/api/vendor/proposals/:id/document",
	},
	vendorProposalDocumentFile: {
		method: "GET",
		path: "/api/vendor/proposals/:id/document",
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
	/** Multipart: the supporting document is a file, not a JSON body. */
	vendorPortfolioDocument: {
		method: "POST",
		path: "/api/vendor/portfolio/:id/document",
	},
	vendorPortfolioDocumentFile: {
		method: "GET",
		path: "/api/vendor/portfolio/:id/document",
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
	businessProfile: { method: "GET", path: "/api/business/profile" },
	businessSaveProfile: { method: "PUT", path: "/api/business/profile" },
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
	/** The bid's own PDF, as the company evaluating the tender reads it. */
	businessBidDocument: {
		method: "GET",
		path: "/api/business/procurement/:projectId/proposals/:proposalId/document",
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
	businessStartLvv: {
		method: "POST",
		path: "/api/business/projects/:id/lvv",
	},
	businessProjectBlueprint: {
		method: "GET",
		path: "/api/business/projects/:id/blueprint",
	},
	businessProjectRegistry: {
		method: "GET",
		path: "/api/business/projects/:id/registry",
	},
	businessRiskInsight: {
		method: "POST",
		path: "/api/business/risk/insight",
	},
	businessProjectReading: {
		method: "POST",
		path: "/api/business/review/reading",
	},
	businessProjectForecast: {
		method: "POST",
		path: "/api/business/review/forecast",
	},
	businessProjectForecastReading: {
		method: "POST",
		path: "/api/business/review/forecast/reading",
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

/**
 * What a person registers as. They represent the organization, so the account
 * carries both their own details and the entity's: a company submits projects,
 * a vendor delivers them.
 */
export const organizationTypes = ["company", "vendor"] as const;
export type OrganizationType = (typeof organizationTypes)[number];

/**
 * The sectors a company registers under, and the vocabulary projects are
 * submitted in, so a project's sector can be compared with a company's. The
 * first four are the carbon-intensive commodities the platform targets first;
 * the rest cover the industrial base behind them.
 */
export const industrySectors = [
	"Cement",
	"Iron and steel",
	"Aluminium",
	"Fertiliser",
	"Textile",
	"Food and beverage",
	"Chemical",
	"Pulp and paper",
	"Machinery",
	"Automotive",
	"Commercial buildings",
	"Public sector",
	"Agriculture",
] as const;

/** What a vendor delivers. Read as vendor text by the matchmaking pool. */
export const vendorServiceCategories = [
	"ESCO",
	"Solar PV EPC",
	"Biomass and bioenergy",
	"Energy audit",
	"Boiler and steam systems",
	"Compressed air systems",
	"HVAC and chillers",
	"Waste heat recovery",
	"Lighting retrofit",
] as const;

/**
 * Credential limits shared by login, register and step-up. Kept here rather than
 * in the auth module so the client can cap its inputs at the same numbers the
 * server rejects on.
 */
export const credentialLimits = { email: 254, password: 128 } as const;

/** Registration field limits, enforced on the server and mirrored by the form. */
export const registerLimits = {
	name: 120,
	phone: 32,
	organizationName: 200,
	industry: 120,
	address: 300,
	businessInfo: 2000,
	/** NIB and NPWP as they are written on the document. */
	legalId: 32,
} as const;

/**
 * One registration for both organizations. The account fields are the person's;
 * the organization fields describe the entity they represent. Vendor-only
 * fields stay optional: a vendor can add them in settings before verification.
 */
export interface RegisterBody {
	accountType: OrganizationType;
	/** The representative, not the organization. */
	name: string;
	email: string;
	password: string;
	phone: string;
	organizationName: string;
	/** Company: a sector from `industrySectors`. Vendor: a service category. */
	industry: string;
	address: string;
	/** Vendor only: what the company does, in its own words. */
	businessInfo?: string;
	/** Vendor only: legal identity, required before an admin verifies. */
	nib?: string;
	npwp?: string;
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
 * The three scenarios the financial engine runs a project through. The names
 * are the ones the blueprint and every screen read, so a scenario key never
 * has to be translated.
 */
export const forecastScenarioKeys = [
	"conservative",
	"base",
	"optimistic",
] as const;
export type ForecastScenarioKey = (typeof forecastScenarioKeys)[number];

/** One scenario's cash-flow assumptions and what they produce. */
export interface ForecastScenario {
	key: ForecastScenarioKey;
	/** What the screen calls it: "Conservative", "Base Case", "Optimistic". */
	label: string;
	/** Share of the planned annual saving the scenario assumes, in percent. */
	savingPct: number;
	/** Annual energy-price inflation applied to the saving, in percent. */
	inflationPct: number;
	/** Annual asset degradation applied to the saving, in percent. */
	degradationPct: number;
	/** The saving the scenario starts from, in rupiah per year. */
	firstYearSavingRp: number;
	npvRp: number;
	/** Null when the cash flows never repay the capital at any rate. */
	irrPct: number | null;
	/** Years to recover the capital at the first-year saving. */
	paybackYears: number | null;
	/**
	 * The capital as the project recovers it, one entry per year of the
	 * horizon with the capital itself at index zero: the running total of the
	 * discounted savings against the money spent, so the series crosses zero in
	 * the year the capital is repaid in present-value terms and ends at
	 * `npvRp`. It is what a chart of the forecast plots.
	 */
	recoveryRp: number[];
}

/**
 * The ROI forecast: the three scenarios plus the base case lifted to the top
 * level, because most readers only want the headline.
 */
export interface RoiForecast {
	/** The money the scenarios are recovering, as Step 2 entered it. */
	capexRp: number;
	/** The rate the cash flows are discounted at, in percent. */
	discountRatePct: number;
	/** How many years the cash flows run for: the funding's own tenor. */
	horizonYears: number;
	/** The base case, for the screens that show one set of figures. */
	npvRp: number;
	irrPct: number | null;
	paybackYears: number | null;
	scenarios: ForecastScenario[];
}

/** The Step 2 figures the forecast is computed from. */
export interface BusinessForecastRequest {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
}

/**
 * The forecast as the wizard reads it. `forecast` is null while the figures
 * are not complete enough to compute one, which is a state the panel names
 * rather than a zero it would have to explain.
 */
export interface BusinessForecastResponse {
	forecast: RoiForecast | null;
}

/**
 * Eleanor's reading of the forecast. Same envelope as every other reading, and
 * asked for separately from the figures: the scenarios are arithmetic and land
 * at once, while she takes a moment to write about them.
 */
export interface BusinessForecastReadingResponse {
	reading: BusinessRiskInsight;
}

/** How the project is funded: the bond the blueprint hands to the SCF partner. */
export interface BlueprintFundingStructure {
	instrument: "green_bond";
	capexRp: number;
	tenorYears: number;
	annualSavingRp: number;
	annualRevenueRp: number | null;
	/** The collateral the company offered, in the words it entered. */
	collateral: string | null;
}

/** What the project promises to cut, against the measured baseline. */
export interface BlueprintEmissionTargets {
	baselineTco2: number;
	targetPct: number;
	targetTco2: number;
	energySavingKwh: number;
}

/**
 * The blueprint's financial projections, scenarios included.
 *
 * Every field is optional because the JSON column holds a document at whatever
 * stage it reached: a blueprint written before the financial engine existed
 * carries only the headline figures.
 */
export interface BlueprintFinancialProjections {
	npv?: number;
	irr?: number | null;
	paybackPeriod?: number | null;
	discountRatePct?: number;
	horizonYears?: number;
	scenarios?: ForecastScenario[];
}

/**
 * The Green Project Blueprint document: the technical case LVV GRK validates
 * and the SCF partner issues against. Sections are optional for the same
 * reason the projections are: the stored document is only as complete as the
 * stage it was written at.
 */
export interface BlueprintDocument {
	fundingStructure?: BlueprintFundingStructure;
	emissionTargets?: BlueprintEmissionTargets;
	financialProjections?: BlueprintFinancialProjections;
}

/**
 * The Green Project Blueprint as a reader sees it: the projections, the funding
 * structure and the emission targets behind them, and the stage the document
 * has reached.
 *
 * One shape for both readers, because it is one document: the company reads its
 * own at whatever stage it is at, and a bidder reads it during procurement
 * behind the extra gate that only a validated or a published blueprint is shown
 * to vendors.
 */
export interface ProjectBlueprintView extends BlueprintSummary {
	status: string;
	validatedAt: string | null;
	/** The rate the document discounts at, and the years it runs for. */
	discountRatePct: number | null;
	horizonYears: number | null;
	fundingStructure: BlueprintFundingStructure | null;
	emissionTargets: BlueprintEmissionTargets | null;
	/**
	 * The three cases, each carrying its own `recoveryRp` series: the running
	 * total of the discounted savings against the capital, which is what the
	 * document's projection chart plots.
	 */
	scenarios: ForecastScenario[];
}

/**
 * What the public listing says about the project's measured emissions. The
 * money lives with the partner app; what GreenShift reports here is what the
 * MRV periods actually cut, against what the blueprint promised.
 */
export interface BondMonitoring {
	/** Tonnes of CO2e the verified MRV periods add up to. */
	verifiedTco2: number;
	/** How many MRV periods have been reported. */
	periods: number;
	/** The latest reported period, "YYYY-MM". */
	latestPeriod: string | null;
	/** True when a verified period deviated from its baseline. */
	anomalyFlagged: boolean;
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

/**
 * A single bond listing shown on the public bond dashboard.
 *
 * The listing reports what GreenShift measures: the project's verified
 * emission reductions against the target its blueprint promised. The issuance
 * and the money around it belong to the SCF partner, so the card carries no
 * amount, no funding total and no coupon: it carries the code the investor
 * searches for in the partner app.
 */
export interface BondListing {
	id: number;
	title: string;
	/** Broker-facing code investors search for in Trima+/IPOT. */
	bondCode: string | null;
	companyName: string | null;
	industrySector: string | null;
	location: string | null;
	riskScore: number | null;
	targetEmissionReduction: number | null;
	estimatedEnergySaving: number | null;
	status: BondStatus;
	/** When the listing became verified; drives the date shown on the card. */
	verifiedAt: string | null;
	monitoring: BondMonitoring;
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
	industrySector: string | null;
	serviceCategory: string | null;
	address: string | null;
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

/**
 * A partial update: omitted keys keep their stored value, so saving the company
 * name from one form cannot clear the legal identity captured at registration.
 */
export interface VendorProfileBody {
	companyName: string;
	description?: string;
	serviceCategory?: string;
	location?: string;
	nib?: string;
	npwp?: string;
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

/**
 * What a bid carries, and what `POST /api/vendor/proposals` takes as multipart
 * fields. The tender and the amount are the bid; the rest is what the vendor
 * chooses to state, and an absent field is stored as absent rather than as a
 * zero it was never given.
 *
 * The proposal document is the one required part: it is a file in the same
 * request, so a bid cannot exist without the case it is made on.
 */
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
	/**
	 * Where the filed document is served from, or null when the record carries
	 * no file. A URL rather than a key: the caller only ever opens it.
	 */
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

// ── Business role ─────────────────────────────────────────
// The wizard collects a project in three steps, reviews it on a fourth and
// submits it for LVV review.
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

/**
 * Step 3: the scope of work. These two lists are what a bidder is measured
 * against: the key technical requirements are the company's own statement of
 * what the delivery must meet (and part of the vocabulary the matching model
 * reads), and the deliverables are what the vendor is expected to hand over.
 */
export interface BusinessStep3 {
	requirements: string[];
	deliverables: string[];
}

/**
 * A partial Step 1, Step 2 or Step 3 block. On autosave an absent key means the
 * field was not touched, while an explicit `null` means it was cleared.
 */
export type BusinessStep1Patch = Partial<{
	[K in keyof BusinessStep1]: BusinessStep1[K] | null;
}>;
export type BusinessStep2Patch = Partial<{
	[K in keyof BusinessStep2]: BusinessStep2[K] | null;
}>;
export type BusinessStep3Patch = Partial<{
	[K in keyof BusinessStep3]: BusinessStep3[K] | null;
}>;

/** Body of `PUT /api/business/drafts/:draftId`. Every block is optional. */
export interface BusinessDraftBody {
	step?: 1 | 2 | 3 | 4;
	step1?: BusinessStep1Patch;
	step2?: BusinessStep2Patch;
	step3?: BusinessStep3Patch;
}

/** The stored draft, merged. Null blocks have never been touched. */
export interface BusinessDraft {
	id: string;
	step: number | null;
	updatedAt: string | null;
	step1: BusinessStep1Patch | null;
	step2: BusinessStep2Patch | null;
	step3: BusinessStep3Patch | null;
}

export interface BusinessDraftResponse {
	draft: BusinessDraft;
}

/**
 * A file attached to an unsubmitted draft. The upload returns it and the resume
 * returns them all, so a draft that comes back after a reload still knows the
 * files it holds: the ids inside `step2.fileIds` name files, and this is what the
 * file names and sizes are read from.
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
 * The funding case the submission filed: the Step 2 figures, read back by the
 * project's own page so it shows the same summary the review step showed.
 * `jaminan` is free text because it is the collateral the company offered
 * described in its own words, not an amount.
 */
export interface BusinessProjectFunding {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
}

/**
 * The submitted project, with the scores the server derived. The client never
 * computes these, so they are absent from the request body by design.
 */
export interface BusinessSubmittedProject {
	id: number;
	title: string;
	status: string;
	/** The stage in the words the app shows, e.g. "Awaiting LVV verification". */
	statusLabel: string;
	submittedAt: string | null;
	/** Tonnes of CO2e per year: consumption x emission factor. */
	baselineTco2: number | null;
	creditScore: number | null;
	creditRating: string | null;
	riskScore: number | null;
	riskLevel: string | null;
	/** Where the project is, and what it costs, as the wizard recorded them. */
	location: string | null;
	sector: string | null;
	/** The Step 2 figures, for the summary this project's page renders. */
	funding: BusinessProjectFunding;
	/**
	 * The Step 3 scope of work: what a bidder must meet, and what the delivery
	 * hands over. Read back by the project's page and by every vendor surface.
	 */
	technicalRequirements: string[];
	deliverables: string[];
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

/**
 * The project's own Green Project Blueprint, or null while it has none: the
 * document is written at verification, so a project still waiting on its LVV
 * body answers with null rather than an empty document.
 */
export interface BusinessProjectBlueprintResponse {
	blueprint: ProjectBlueprintView | null;
}

/**
 * What the environmental registry answers about a project. The company registers
 * the project at Sistem Registri itself, so this is how the platform can tell
 * that the registration happened there while the project still sits waiting for
 * verification here.
 */
export interface BusinessProjectRegistryResponse {
	registered: boolean;
}

/** One row of the project table. `status` is the pill label, not the DB enum. */
export interface BusinessProjectSummary {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	/** "Register for LVV" | "Awaiting LVV verification" | "Matchmaking" | "Verified". */
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

/**
 * A mark the company drew on a vendor's proposal. Coordinates are fractions of
 * the proposal page, so the same mark lands in the same place for the vendor,
 * who reads the document at whatever width their screen gives it.
 */
export type ProposalMarkKind = "highlight" | "circle";

export interface ProposalAnnotation {
	id: string;
	kind: ProposalMarkKind;
	x: number;
	y: number;
	w: number;
	h: number;
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

/**
 * One revision round on a bid: what the company asked for, where it marked the
 * proposal, and what the vendor answered. Both sides read the same row, which is
 * what makes the request and its answer one thread.
 */
export interface BusinessBidNegotiation {
	id: number;
	iterationNumber: number;
	status: string;
	companyNote: string;
	annotations: ProposalAnnotation[];
	requestedFields: string[];
	vendorRevisedPrice: number | null;
	vendorRevisedWarrantyYears: number | null;
	vendorResponseNote: string | null;
	respondedAt: string | null;
	createdAt: string;
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
	/** The proposal PDF the vendor filed, or null when the bid carries none. */
	documentName: string | null;
	documentUrl: string | null;
	/** Every revision round on this bid, oldest first. */
	negotiations: BusinessBidNegotiation[];
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
	decision: "revision" | "reject";
	/** Required when asking for a revision: the vendor is told what to change. */
	note?: string | null;
	/** Where the company marked the proposal it is asking about. */
	annotations?: ProposalAnnotation[];
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

/**
 * The company account as its own settings screen reads it: the organization it
 * represents and the person who represents it, both stored on the account row.
 * `contactEmail` is the sign-in identity, so it is read here and never written.
 */
export interface BusinessProfile {
	id: number;
	companyName: string | null;
	representative: string;
	industrySector: string | null;
	address: string | null;
	contactEmail: string;
	contactPhone: string | null;
	updatedAt: string | null;
}

/**
 * Body of `PUT /api/business/profile`. The company name is required; the rest
 * is optional and an absent key keeps its stored value, so saving one field
 * cannot clear the others.
 */
export interface BusinessProfileBody {
	companyName: string;
	representative?: string;
	/** One of `industrySectors`. */
	industrySector?: string;
	address?: string;
	contactPhone?: string;
}

export interface BusinessProfileResponse {
	profile: BusinessProfile;
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
