import type { CompanyDocument, CompanyDocumentScan, CompanyVerificationStatus } from "./verification";

export interface VerifyUserBody {
	verified: boolean;
	/** Why the account was turned down. Read by the company and corrected. */
	rejectionReason?: string | null;
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
	/** The pack the verdict is about: identity numbers and the certificate. */
	nib: string | null;
	npwp: string | null;
	tdp: string | null;
	certificateName: string | null;
	certificateUrl: string | null;
	certificateScan: CompanyDocumentScan | null;
	/** Why the profile was turned down, as the vendor reads it. */
	rejectionReason: string | null;
}

export interface VerifyVendorBody {
	verified: boolean;
	rejectionReason?: string | null;
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
	/** Where a company account stands, so the row can say more than yes or no. */
	verificationState: CompanyVerificationStatus | null;
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

/** A month with no activity is zeroes, not omitted, so the charts keep an even axis. */
export interface AdminAnalyticsPoint {
	/** Calendar month in UTC, `YYYY-MM`. */
	month: string;
	users: number;
	/** Of those, accounts that carry a company name. */
	organizations: number;
	projects: number;
	investments: number;
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

/** Certificate URLs point at the admin's own read route. */
export interface AdminCompanyVerification {
	userId: number;
	companyName: string | null;
	industrySector: string | null;
	address: string | null;
	representative: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	nib: string | null;
	npwp: string | null;
	submittedAt: string | null;
	verifiedAt: string | null;
	rejectionReason: string | null;
	documents: CompanyDocument[];
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
