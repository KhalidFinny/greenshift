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
	adminUserVerification: {
		method: "GET",
		path: "/api/admin/users/:id/verification",
	},
	adminUserVerificationDocument: {
		method: "GET",
		path: "/api/admin/users/:id/verification/documents/:slot",
	},
	adminVendors: { method: "GET", path: "/api/admin/vendors" },
	adminVerifyVendor: {
		method: "PATCH",
		path: "/api/admin/vendors/:id/verify",
	},
	adminVendorCertificate: {
		method: "GET",
		path: "/api/admin/vendors/:id/certificate",
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
	vendorCertificate: {
		method: "POST",
		path: "/api/vendor/profile/certificate",
	},
	vendorCertificateFile: {
		method: "GET",
		path: "/api/vendor/profile/certificate",
	},
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
	businessVerification: {
		method: "GET",
		path: "/api/business/verification",
	},
	businessSaveVerification: {
		method: "PUT",
		path: "/api/business/verification",
	},
	businessVerificationDocument: {
		method: "POST",
		path: "/api/business/verification/documents/:slot",
	},
	businessVerificationDocumentFile: {
		method: "GET",
		path: "/api/business/verification/documents/:slot",
	},
	businessRemoveVerificationDocument: {
		method: "DELETE",
		path: "/api/business/verification/documents/:slot",
	},
	businessSubmitVerification: {
		method: "POST",
		path: "/api/business/verification/submit",
	},
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
	businessBrokers: { method: "GET", path: "/api/business/brokers" },
	businessProjectBroker: {
		method: "GET",
		path: "/api/business/projects/:id/broker",
	},
	businessAssignBroker: {
		method: "POST",
		path: "/api/business/projects/:id/broker",
	},
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

export interface HealthResponse {
	status: "ok" | "degraded";
	checks: Record<string, { status: "ok" | "error" }>;
	timestamp: string;
}
