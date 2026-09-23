import type {
	AdminAnalytics,
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
	BusinessAwardBody,
	BusinessBidReviewBody,
	BusinessDocumentResponse,
	BusinessDocumentsResponse,
	BusinessDraftBody,
	BusinessDraftResponse,
	BusinessDraftResumeResponse,
	BusinessForecastReadingResponse,
	BusinessForecastRequest,
	BusinessForecastResponse,
	BusinessMatchingRunResponse,
	BusinessMatchmakingDetail,
	BusinessMatchmakingListResponse,
	BusinessMatchmakingSelectionBody,
	BusinessMatchmakingSelectionResponse,
	BusinessNotification,
	BusinessProfileBody,
	BusinessProfileResponse,
	BusinessProjectBlueprintResponse,
	BusinessProjectReadingRequest,
	BusinessProjectReadingResponse,
	BusinessProjectRegistryResponse,
	BusinessProjectResponse,
	BusinessProjectsResponse,
	BusinessRiskInsightRequest,
	BusinessRiskInsightResponse,
	BusinessRiskResponse,
	BusinessSubmitBody,
	BusinessSubmitResponse,
	BusinessTender,
	CsrfResponse,
	HealthResponse,
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
		register: (body: RegisterBody) =>
			request<AuthResponse>(apiRoutes.register.path, {
				method: apiRoutes.register.method,
				body: JSON.stringify(body satisfies RegisterBody),
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
	account: {
		uploadAvatar: (file: File) => {
			const body = new FormData();
			body.set("avatar", file);
			return request<{ avatarKey: string }>(
				apiRoutes.accountAvatarUpload.path,
				{ method: apiRoutes.accountAvatarUpload.method, body },
			);
		},
		removeAvatar: () =>
			request<{ avatarKey: null }>(apiRoutes.accountAvatarDelete.path, {
				method: apiRoutes.accountAvatarDelete.method,
			}),
		/**
		 * The picture URL, keyed on the stored object so a replacement shows up
		 * immediately instead of being served from cache.
		 */
		avatarPath: (key: string) =>
			`${apiRoutes.accountAvatar.path}?v=${encodeURIComponent(key)}`,
	},
	business: {
		/**
		 * Autosave. Silent: this fires while the user types, and a toast per
		 * save would be noise. The server merges the patch over the stored draft.
		 */
		saveDraft: (draftId: string, body: BusinessDraftBody) =>
			request<BusinessDraftResponse>(
				apiRoutes.businessDraft.path.replace(
					":draftId",
					encodeURIComponent(draftId),
				),
				{
					method: apiRoutes.businessDraft.method,
					body: JSON.stringify(body satisfies BusinessDraftBody),
					silent: true,
				},
			),
		matchmaking: (params?: { limit?: number }) =>
			request<BusinessMatchmakingListResponse>(
				apiRoutes.businessMatchmaking.path + query(params),
			),
		/** Re-runs the matching model over the verified vendor pool. */
		runMatching: (projectId: number) =>
			request<BusinessMatchingRunResponse>(
				apiRoutes.businessMatchmakingMatching.path.replace(
					":projectId",
					String(projectId),
				),
				{ method: apiRoutes.businessMatchmakingMatching.method },
			),
		matchmakingDetail: (projectId: number) =>
			request<BusinessMatchmakingDetail>(
				apiRoutes.businessMatchmakingDetail.path.replace(
					":projectId",
					String(projectId),
				),
			),
		saveMatchmakingSelection: (
			projectId: number,
			body: BusinessMatchmakingSelectionBody,
		) =>
			request<BusinessMatchmakingSelectionResponse>(
				apiRoutes.businessMatchmakingSelection.path.replace(
					":projectId",
					String(projectId),
				),
				{
					method: apiRoutes.businessMatchmakingSelection.method,
					body: JSON.stringify(body satisfies BusinessMatchmakingSelectionBody),
				},
			),
		closeTender: (projectId: number) =>
			request<{ tender: BusinessTender }>(
				apiRoutes.businessTenderClose.path.replace(
					":projectId",
					String(projectId),
				),
				{
					method: apiRoutes.businessTenderClose.method,
					body: JSON.stringify({ action: "close" }),
				},
			),
		awardBid: (projectId: number, body: BusinessAwardBody) =>
			request<{ tender: BusinessTender }>(
				apiRoutes.businessTenderAward.path.replace(
					":projectId",
					String(projectId),
				),
				{
					method: apiRoutes.businessTenderAward.method,
					body: JSON.stringify(body satisfies BusinessAwardBody),
				},
			),
		reviewBid: (
			projectId: number,
			proposalId: number,
			body: BusinessBidReviewBody,
		) =>
			request<{ status: string }>(
				apiRoutes.businessBidReview.path
					.replace(":projectId", String(projectId))
					.replace(":proposalId", String(proposalId)),
				{
					method: apiRoutes.businessBidReview.method,
					body: JSON.stringify(body satisfies BusinessBidReviewBody),
				},
			),
		notifications: (params?: { limit?: number }) =>
			request<{ notifications: BusinessNotification[] }>(
				apiRoutes.businessNotifications.path + query(params),
			),
		readNotification: (id: number) =>
			request<OkResponse>(
				apiRoutes.businessReadNotification.path.replace(":id", String(id)),
				{ method: apiRoutes.businessReadNotification.method },
			),
		/** The whole feed: registered after the `:id` route, so paths cannot clash. */
		readAllNotifications: () =>
			request<{ read: number }>(apiRoutes.businessNotifications.path, {
				method: apiRoutes.businessReadNotification.method,
			}),
		draft: (draftId: string) =>
			request<BusinessDraftResumeResponse>(
				apiRoutes.businessDraftResume.path.replace(
					":draftId",
					encodeURIComponent(draftId),
				),
			),
		/** Multipart: the shared request helper leaves the boundary to the browser. */
		uploadDocument: (draftId: string, file: File, slot: string) => {
			const body = new FormData();
			body.set("file", file);
			body.set("slot", slot);
			return request<BusinessDocumentResponse>(
				apiRoutes.businessUploadDocument.path.replace(
					":draftId",
					encodeURIComponent(draftId),
				),
				{ method: apiRoutes.businessUploadDocument.method, body },
			);
		},
		deleteDocument: (draftId: string, docId: string) =>
			request<{ ok: true }>(
				apiRoutes.businessDeleteDocument.path
					.replace(":draftId", encodeURIComponent(draftId))
					.replace(":docId", encodeURIComponent(docId)),
				{ method: apiRoutes.businessDeleteDocument.method },
			),
		submit: (body: BusinessSubmitBody) =>
			request<BusinessSubmitResponse>(apiRoutes.businessSubmit.path, {
				method: apiRoutes.businessSubmit.method,
				body: JSON.stringify(body satisfies BusinessSubmitBody),
			}),
		profile: () =>
			request<BusinessProfileResponse>(apiRoutes.businessProfile.path),
		saveProfile: (body: BusinessProfileBody) =>
			request<BusinessProfileResponse>(apiRoutes.businessSaveProfile.path, {
				method: apiRoutes.businessSaveProfile.method,
				body: JSON.stringify(body satisfies BusinessProfileBody),
			}),
		projects: (params?: { limit?: number }) =>
			request<BusinessProjectsResponse>(
				apiRoutes.businessProjects.path + query(params),
			),
		project: (id: number) =>
			request<BusinessProjectResponse>(
				apiRoutes.businessProject.path.replace(":id", String(id)),
			),
		risk: (id: number) =>
			request<BusinessRiskResponse>(
				apiRoutes.businessProjectRisk.path.replace(":id", String(id)),
			),
		/**
		 * The project's own Green Project Blueprint, or null while it has none:
		 * the document is written at verification.
		 */
		blueprint: (id: number) =>
			request<BusinessProjectBlueprintResponse>(
				apiRoutes.businessProjectBlueprint.path.replace(":id", String(id)),
			),
		/**
		 * What Sistem Registri answers about the project: registered or not, which
		 * is what tells the page a company did it there and has not started
		 * verification here.
		 */
		registry: (id: number) =>
			request<BusinessProjectRegistryResponse>(
				apiRoutes.businessProjectRegistry.path.replace(":id", String(id)),
			),
		/**
		 * The company marks the project registered at the registry and its LVV
		 * body appointed, which starts verification.
		 */
		startLvv: (id: number) =>
			request<BusinessProjectResponse>(
				apiRoutes.businessStartLvv.path.replace(":id", String(id)),
				{ method: apiRoutes.businessStartLvv.method },
			),
		/** The wizard's assessment, answered with Eleanor's reading of it. */
		riskInsight: (body: BusinessRiskInsightRequest) =>
			request<BusinessRiskInsightResponse>(apiRoutes.businessRiskInsight.path, {
				method: apiRoutes.businessRiskInsight.method,
				body: JSON.stringify(body satisfies BusinessRiskInsightRequest),
			}),
		/** The review step's opening reading, written from the figures entered so far. */
		projectReading: (body: BusinessProjectReadingRequest) =>
			request<BusinessProjectReadingResponse>(
				apiRoutes.businessProjectReading.path,
				{
					method: apiRoutes.businessProjectReading.method,
					body: JSON.stringify(body satisfies BusinessProjectReadingRequest),
				},
			),
		/** The ROI forecast for the figures entered so far: the same engine the blueprint is generated with. */
		projectForecast: (body: BusinessForecastRequest) =>
			request<BusinessForecastResponse>(
				apiRoutes.businessProjectForecast.path,
				{
					method: apiRoutes.businessProjectForecast.method,
					body: JSON.stringify(body satisfies BusinessForecastRequest),
				},
			),
		/** Eleanor's reading of that forecast, written from the same figures. */
		forecastReading: (body: BusinessForecastRequest) =>
			request<BusinessForecastReadingResponse>(
				apiRoutes.businessProjectForecastReading.path,
				{
					method: apiRoutes.businessProjectForecastReading.method,
					body: JSON.stringify(body satisfies BusinessForecastRequest),
				},
			),
		documents: (id: number) =>
			request<BusinessDocumentsResponse>(
				apiRoutes.businessProjectDocuments.path.replace(":id", String(id)),
			),
		/** The download endpoint is a plain link, so only its path is needed. */
		downloadPath: (id: number, docId: string) =>
			apiRoutes.businessDownloadDocument.path
				.replace(":id", String(id))
				.replace(":docId", encodeURIComponent(docId)),
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
		analytics: () => request<AdminAnalytics>(apiRoutes.adminAnalytics.path),
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
		/**
		 * Multipart: the bid and the proposal document are one filing. The
		 * document is required, so the offer and the case for it are sent
		 * together and the server writes them as one row.
		 */
		submitProposal: (fields: ProposalDraftBody, file: File) => {
			const body = new FormData();
			body.set("tenderId", String(fields.tenderId));
			body.set("amount", String(fields.amount));
			if (fields.technicalSpec !== undefined) {
				body.set("technicalSpec", fields.technicalSpec);
			}
			if (fields.operationalCost !== undefined) {
				body.set("operationalCost", String(fields.operationalCost));
			}
			if (fields.projectedRoi !== undefined) {
				body.set("projectedRoi", String(fields.projectedRoi));
			}
			if (fields.warrantyPeriod !== undefined) {
				body.set("warrantyPeriod", String(fields.warrantyPeriod));
			}
			body.set("file", file);
			return request<{ proposal: ProposalSummary }>(
				apiRoutes.vendorSubmitProposal.path,
				{ method: apiRoutes.vendorSubmitProposal.method, body },
			);
		},
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
		/** Multipart: the shared request helper leaves the boundary to the browser. */
		uploadProposalDocument: (id: number, file: File) => {
			const body = new FormData();
			body.set("file", file);
			return request<{ documentName: string }>(
				apiRoutes.vendorProposalDocument.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorProposalDocument.method, body },
			);
		},
		notifications: (params?: { limit?: number }) =>
			request<{ notifications: VendorNotification[] }>(
				apiRoutes.vendorNotifications.path + query(params),
			),
		readNotification: (id: number) =>
			request<OkResponse>(
				apiRoutes.vendorReadNotification.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorReadNotification.method },
			),
		/** The whole feed: registered after the `:id` route, so paths cannot clash. */
		readAllNotifications: () =>
			request<{ read: number }>(apiRoutes.vendorNotifications.path, {
				method: apiRoutes.vendorReadNotification.method,
			}),
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
		leaderboard: (tenderId?: number) =>
			request<VendorLeaderboardResponse>(
				apiRoutes.vendorLeaderboard.path +
					query(tenderId === undefined ? undefined : { tenderId }),
			),
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
		/** Multipart: the shared request helper leaves the boundary to the browser. */
		uploadPortfolioDocument: (id: number, file: File) => {
			const body = new FormData();
			body.set("file", file);
			return request<{ item: VendorPortfolioItem }>(
				apiRoutes.vendorPortfolioDocument.path.replace(":id", String(id)),
				{ method: apiRoutes.vendorPortfolioDocument.method, body },
			);
		},
		/** Where a filed portfolio document is served from. */
		portfolioDocumentPath: (id: number) =>
			apiRoutes.vendorPortfolioDocumentFile.path.replace(":id", String(id)),
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
		/** The whole feed: registered after the `:id` route, so paths cannot clash. */
		readAllNotifications: () =>
			request<{ read: number }>(apiRoutes.brokerNotifications.path, {
				method: apiRoutes.brokerReadNotification.method,
			}),
	},
	/** Read-only platform probes (`GET /api/health`), used by the admin console. */
	system: {
		health: () => request<HealthResponse>(apiRoutes.health.path),
	},
};

export type { AuthUser };
