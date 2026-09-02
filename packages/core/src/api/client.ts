import {
	type AdminAnomalyResponse,
	type AdminBlueprint,
	type AdminInvestment,
	type AdminProject,
	type AdminRoiPayment,
	type AdminStats,
	type AdminUser,
	type AdminVendor,
	type AuditLogEntry,
	type AuthResponse,
	type CsrfResponse,
	apiRoutes,
	type BlueprintUpdateBody,
	type LoginBody,
	type OkResponse,
	type ProposalDetail,
	type ProposalDraftBody,
	type ProposalSummary,
	type ProposalUpdateBody,
	type RegisterBody,
	type StepUpBody,
	type StepUpResponse,
	type UpdateStatusBody,
	type VendorMyProject,
	type VendorMyProjectDetail,
	type VendorProcurementStatusItem,
	type VendorProfile,
	type VendorProfileBody,
	type VendorProjectDetail,
	type VendorProjectListItem,
	type VerifyUserBody,
	type VerifyVendorBody,
} from "@greenshift/api/contracts";
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
 * @greenshift/api — nothing API-related is hardcoded here.
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
		logout: () =>
			request<OkResponse>(apiRoutes.logout.path, {
				method: apiRoutes.logout.method,
			}),
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
			request<{ profile: VendorProfile }>(
				apiRoutes.vendorSaveProfile.path,
				{
					method: apiRoutes.vendorSaveProfile.method,
					body: JSON.stringify(body satisfies VendorProfileBody),
				},
			),
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
	},
};

export type { AuthUser };
