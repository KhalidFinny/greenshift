import type {
	AdminAnomalyResponse,
	AdminBlueprint,
	AdminBroker,
	AdminInvestment,
	AdminProject,
	AdminRoiPayment,
	AdminStats,
	AdminUser,
	AdminVendor,
	AuditLogEntry,
	AuthResponse,
	BlueprintUpdateBody,
	BondMarketResponse,
	BrokerAssignedProject,
	BrokerAssignmentResponseBody,
	BrokerBondUpdateBody,
	BrokerDocumentRequest,
	BrokerDocumentRequestBody,
	BrokerDocumentReviewBody,
	BrokerMonthlyReport,
	BrokerNotification,
	BrokerProfile,
	BrokerProfileBody,
	BrokerProjectStatusBody,
	CsrfResponse,
	LoginBody,
	OkResponse,
	ProposalDetail,
	ProposalDraftBody,
	ProposalSummary,
	ProposalUpdateBody,
	RegisterBody,
	StepUpBody,
	StepUpResponse,
	UpdateStatusBody,
	VendorLeaderboardResponse,
	VendorMilestone,
	VendorMilestoneEvidence,
	VendorMyProject,
	VendorMyProjectDetail,
	VendorNegotiation,
	VendorNegotiationResponseBody,
	VendorNotification,
	VendorPortfolioBody,
	VendorPortfolioItem,
	VendorProcurementStatusItem,
	VendorProfile,
	VendorProfileBody,
	VendorProjectDetail,
	VendorProjectListItem,
	VerifyBrokerBody,
	VerifyUserBody,
	VerifyVendorBody,
} from "@greenshift/api/contracts";
import { apiRoutes } from "@greenshift/api/contracts";
import type { AuthUser } from "../auth/types";
import { request } from "./http";

/** Build a query string from defined params ("?role=admin&limit=50"). */
function query(params?: Record<string, string | number | undefined>) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params ?? {})) {
		if (value !== undefined) search.set(key, String(value));
	}
	const encoded = search.toString();
	return encoded ? `?${encoded}` : "";
}

/**
 * Typed client for the single GreenShift API.
 * Paths, methods, and body shapes come from the shared contract in
 * @greenshift/api: nothing API-related is hardcoded here.
 */
export const api = {
	auth: {
		login: (email: string, password: string) =>
			request<AuthResponse>(apiRoutes.login.path, {
				method: apiRoutes.login.method,
				body: JSON.stringify({ email, password } satisfies LoginBody),
			}),
		register: (
			name: string,
			email: string,
			password: string,
			companyName: string,
		) =>
			request<AuthResponse>(apiRoutes.register.path, {
				method: apiRoutes.register.method,
				body: JSON.stringify({
					name,
					email,
					password,
					companyName,
				} satisfies RegisterBody),
			}),
		me: () => request<AuthResponse>(apiRoutes.me.path),
		csrf: () => request<CsrfResponse>(apiRoutes.csrf.path),
		stepUp: (password: string) =>
			request<StepUpResponse>(apiRoutes.stepUp.path, {
				method: apiRoutes.stepUp.method,
				body: JSON.stringify({ password } satisfies StepUpBody),
			}),
		logout: (silent = false) =>
			request<OkResponse>(apiRoutes.logout.path, {
				method: apiRoutes.logout.method,
				silent,
			}),
	},
	investor: {
		market: () => request<BondMarketResponse>(apiRoutes.investorMarket.path),
	},
	admin: {
		users: (params?: { role?: string; limit?: number }) =>
			request<{ users: AdminUser[] }>(
				apiRoutes.adminUsers.path + query(params),
			),
		verifyUser: (id: number, verified: boolean) =>
			request<OkResponse>(
				apiRoutes.adminVerifyUser.path.replace(":id", String(id)),
				{
					method: apiRoutes.adminVerifyUser.method,
					body: JSON.stringify({ verified } satisfies VerifyUserBody),
				},
			),
		projects: (params?: { status?: string; limit?: number }) =>
			request<{ projects: AdminProject[] }>(
				apiRoutes.adminProjects.path + query(params),
			),
		projectStatus: (id: number, status: string) =>
			request<OkResponse>(
				apiRoutes.adminProjectStatus.path.replace(":id", String(id)),
				{
					method: apiRoutes.adminProjectStatus.method,
					body: JSON.stringify({ status } satisfies UpdateStatusBody),
				},
			),
		blueprints: (params?: { status?: string; limit?: number }) =>
			request<{ blueprints: AdminBlueprint[] }>(
				apiRoutes.adminBlueprints.path + query(params),
			),
		blueprintStatus: (id: number, status: string, auditNote?: string) =>
			request<OkResponse>(
				apiRoutes.adminBlueprintStatus.path.replace(":id", String(id)),
				{
					method: apiRoutes.adminBlueprintStatus.method,
					body: JSON.stringify({
						status,
						auditNote,
					} satisfies BlueprintUpdateBody),
				},
			),
		investments: (params?: { status?: string; limit?: number }) =>
			request<{ investments: AdminInvestment[] }>(
				apiRoutes.adminInvestments.path + query(params),
			),
		roiPayments: (params?: { status?: string; limit?: number }) =>
			request<{ payments: AdminRoiPayment[] }>(
				apiRoutes.adminRoiPayments.path + query(params),
			),
		payout: (id: number) =>
			request<{ ok: true; escrowTxId: string }>(
				apiRoutes.adminPayout.path.replace(":id", String(id)),
				{ method: apiRoutes.adminPayout.method },
			),
		auditLogs: (params?: { limit?: number }) =>
			request<{ logs: AuditLogEntry[] }>(
				apiRoutes.adminAuditLogs.path + query(params),
			),
		stats: () => request<AdminStats>(apiRoutes.adminStats.path),
		anomalies: () =>
			request<AdminAnomalyResponse>(apiRoutes.adminAnomalies.path),
		vendors: (params?: { limit?: number }) =>
			request<{ vendors: AdminVendor[] }>(
				apiRoutes.adminVendors.path + query(params),
			),
		verifyVendor: (id: number, verified: boolean) =>
			request<OkResponse>(
				apiRoutes.adminVerifyVendor.path.replace(":id", String(id)),
				{
					method: apiRoutes.adminVerifyVendor.method,
					body: JSON.stringify({ verified } satisfies VerifyVendorBody),
				},
			),
		brokers: (params?: { limit?: number }) =>
			request<{ brokers: AdminBroker[] }>(
				apiRoutes.adminBrokers.path + query(params),
			),
		verifyBroker: (id: number, verified: boolean, rejectionReason?: string) =>
			request<OkResponse>(
				apiRoutes.adminVerifyBroker.path.replace(":id", String(id)),
				{
					method: apiRoutes.adminVerifyBroker.method,
					body: JSON.stringify({
						verified,
						rejectionReason,
					} satisfies VerifyBrokerBody),
				},
			),
	},
	vendor: {
		projects: (params?: { status?: string; limit?: number }) =>
			request<{ projects: VendorProjectListItem[] }>(
				apiRoutes.vendorProjects.path + query(params),
			),
		projectDetail: (id: number) =>
			request<{ project: VendorProjectDetail }>(
				apiRoutes.vendorProjectDetail.path.replace(":id", String(id)),
			),
		myProjects: (params?: { limit?: number }) =>
			request<{ projects: VendorMyProject[] }>(
				apiRoutes.vendorMyProjects.path + query(params),
			),
		myProjectDetail: (id: number) =>
			request<{ project: VendorMyProjectDetail }>(
				apiRoutes.vendorMyProjectDetail.path.replace(":id", String(id)),
			),
		procurementStatus: () =>
			request<{ items: VendorProcurementStatusItem[] }>(
				apiRoutes.vendorProcurementStatus.path,
			),
		profile: () =>
			request<{ profile: VendorProfile }>(apiRoutes.vendorProfile.path),
		saveProfile: (body: VendorProfileBody) =>
			request<{ profile: VendorProfile }>(apiRoutes.vendorSaveProfile.path, {
				method: apiRoutes.vendorSaveProfile.method,
				body: JSON.stringify(body satisfies VendorProfileBody),
			}),
		proposals: (params?: { limit?: number }) =>
			request<{ proposals: ProposalSummary[] }>(
				apiRoutes.vendorProposals.path + query(params),
			),
		proposalDetail: (id: number) =>
			request<{ proposal: ProposalDetail }>(
				apiRoutes.vendorProposalDetail.path.replace(":id", String(id)),
			),
		submitProposal: (body: ProposalDraftBody) =>
			request<{ proposal: ProposalSummary }>(
				apiRoutes.vendorSubmitProposal.path,
				{
					method: apiRoutes.vendorSubmitProposal.method,
					body: JSON.stringify(body satisfies ProposalDraftBody),
				},
			),
		updateProposal: (id: number, body: ProposalUpdateBody) =>
			request<{ proposal: ProposalDetail }>(
				apiRoutes.vendorUpdateProposal.path.replace(":id", String(id)),
				{
					method: apiRoutes.vendorUpdateProposal.method,
					body: JSON.stringify(body satisfies ProposalUpdateBody),
				},
			),
		withdrawProposal: (id: number) =>
			request<OkResponse>(
				apiRoutes.vendorWithdrawProposal.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorWithdrawProposal.method },
			),
		notifications: (params?: { limit?: number }) =>
			request<{ notifications: VendorNotification[] }>(
				apiRoutes.vendorNotifications.path + query(params),
			),
		readNotification: (id: number) =>
			request<OkResponse>(
				apiRoutes.vendorReadNotification.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorReadNotification.method },
			),
		negotiations: () =>
			request<{ negotiations: VendorNegotiation[] }>(
				apiRoutes.vendorNegotiations.path,
			),
		respondNegotiation: (id: number, body: VendorNegotiationResponseBody) =>
			request<{ negotiation: VendorNegotiation }>(
				apiRoutes.vendorRespondNegotiation.path.replace(":id", String(id)),
				{
					method: apiRoutes.vendorRespondNegotiation.method,
					body: JSON.stringify(body satisfies VendorNegotiationResponseBody),
				},
			),
		leaderboard: () =>
			request<VendorLeaderboardResponse>(apiRoutes.vendorLeaderboard.path),
		portfolio: () =>
			request<{ portfolio: VendorPortfolioItem[] }>(
				apiRoutes.vendorPortfolio.path,
			),
		addPortfolioItem: (body: VendorPortfolioBody) =>
			request<{ item: VendorPortfolioItem }>(
				apiRoutes.vendorAddPortfolioItem.path,
				{
					method: apiRoutes.vendorAddPortfolioItem.method,
					body: JSON.stringify(body satisfies VendorPortfolioBody),
				},
			),
		deletePortfolioItem: (id: number) =>
			request<OkResponse>(
				apiRoutes.vendorDeletePortfolioItem.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorDeletePortfolioItem.method },
			),
		addMilestoneEvidence: (
			milestoneId: number,
			body: { kind: string; fileName: string; notes?: string },
		) =>
			request<{
				evidence: VendorMilestoneEvidence;
				milestone: VendorMilestone | null;
			}>(
				apiRoutes.vendorAddMilestoneEvidence.path.replace(
					":id",
					String(milestoneId),
				),
				{
					method: apiRoutes.vendorAddMilestoneEvidence.method,
					body: JSON.stringify(body),
				},
			),
	},
	broker: {
		profile: () =>
			request<{ profile: BrokerProfile }>(apiRoutes.brokerProfile.path),
		saveProfile: (body: BrokerProfileBody) =>
			request<{ profile: BrokerProfile }>(apiRoutes.brokerSaveProfile.path, {
				method: apiRoutes.brokerSaveProfile.method,
				body: JSON.stringify(body satisfies BrokerProfileBody),
			}),
		projects: () =>
			request<{ projects: BrokerAssignedProject[] }>(
				apiRoutes.brokerProjects.path,
			),
		respondAssignment: (
			projectId: number,
			body: BrokerAssignmentResponseBody,
		) =>
			request<OkResponse>(
				apiRoutes.brokerProjectRespond.path.replace(":id", String(projectId)),
				{
					method: apiRoutes.brokerProjectRespond.method,
					body: JSON.stringify(body satisfies BrokerAssignmentResponseBody),
				},
			),
		updateProjectStatus: (projectId: number, status: string) =>
			request<OkResponse>(
				apiRoutes.brokerProjectStatus.path.replace(":id", String(projectId)),
				{
					method: apiRoutes.brokerProjectStatus.method,
					body: JSON.stringify({ status } satisfies BrokerProjectStatusBody),
				},
			),
		updateBond: (projectId: number, body: BrokerBondUpdateBody) =>
			request<OkResponse>(
				apiRoutes.brokerProjectBond.path.replace(":id", String(projectId)),
				{
					method: apiRoutes.brokerProjectBond.method,
					body: JSON.stringify(body satisfies BrokerBondUpdateBody),
				},
			),
		documentRequests: (params?: { limit?: number }) =>
			request<{ requests: BrokerDocumentRequest[] }>(
				apiRoutes.brokerDocumentRequests.path + query(params),
			),
		createDocumentRequest: (body: BrokerDocumentRequestBody) =>
			request<{ request: BrokerDocumentRequest }>(
				apiRoutes.brokerCreateDocumentRequest.path,
				{
					method: apiRoutes.brokerCreateDocumentRequest.method,
					body: JSON.stringify(body satisfies BrokerDocumentRequestBody),
				},
			),
		reviewDocument: (id: number, body: BrokerDocumentReviewBody) =>
			request<{ request: BrokerDocumentRequest }>(
				apiRoutes.brokerReviewDocument.path.replace(":id", String(id)),
				{
					method: apiRoutes.brokerReviewDocument.method,
					body: JSON.stringify(body satisfies BrokerDocumentReviewBody),
				},
			),
		reports: () =>
			request<{ reports: BrokerMonthlyReport[] }>(apiRoutes.brokerReports.path),
		report: (id: number) =>
			request<{ report: BrokerMonthlyReport }>(
				apiRoutes.brokerReport.path.replace(":id", String(id)),
			),
		notifications: (params?: { limit?: number }) =>
			request<{ notifications: BrokerNotification[] }>(
				apiRoutes.brokerNotifications.path + query(params),
			),
		readNotification: (id: number) =>
			request<OkResponse>(
				apiRoutes.brokerReadNotification.path.replace(":id", String(id)),
				{ method: apiRoutes.brokerReadNotification.method },
			),
	},
};

export type { AuthUser };
