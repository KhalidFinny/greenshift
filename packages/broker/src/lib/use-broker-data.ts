import { api } from "@greenshift/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	toAssignedProject,
	toDocumentRequest,
	toMonthlyReport,
	toNotification,
	toProfileDetails,
	toVerificationDetails,
} from "./api-mappers";
import type {
	BrokerAssignedProject,
	BrokerDocumentRequest,
	BrokerNotification,
	BrokerProfileDetails,
	BrokerProjectWorkflowStatus,
	BrokerVerificationDetails,
	DocumentCategory,
	ExternalBondIssuanceStatus,
	MonthlyProjectReport,
} from "./types";

/** Profile fields plus the licence filing used for verification (§7). */
interface ProfileSaveInput {
	companyName?: string;
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

const REFRESH_FAST = 60 * 1000;
const REFRESH_SLOW = 2 * 60 * 1000;

/** Numeric API identifiers are carried as strings through the UI. */
function numeric(id: string): number {
	return Number(id);
}

const NOT_VERIFIED: BrokerVerificationDetails = {
	status: "NOT_VERIFIED",
	legalEntityName: "",
};

const EMPTY_PROFILE: BrokerProfileDetails = {
	companyName: "",
	description: "",
	representative: "",
	contactEmail: "",
	contactPhone: "",
	website: "",
	address: "",
};

/**
 * Everything the broker dashboard renders comes from `/api/broker/*`:
 * assigned projects, the document requests raised against them, the official
 * monthly monitoring reports, the notification feed and the firm profile.
 */
export function useBrokerData() {
	const queryClient = useQueryClient();

	// ── Queries ─────────────────────────────────────────────
	const profileQuery = useQuery({
		queryKey: ["broker", "profile"],
		queryFn: () => api.broker.profile(),
		staleTime: 5 * 60 * 1000,
	});

	const projectsQuery = useQuery({
		queryKey: ["broker", "projects"],
		queryFn: () => api.broker.projects(),
		staleTime: REFRESH_SLOW,
	});

	const requestsQuery = useQuery({
		queryKey: ["broker", "document-requests"],
		queryFn: () => api.broker.documentRequests(),
		staleTime: REFRESH_FAST,
	});

	const reportsQuery = useQuery({
		queryKey: ["broker", "reports"],
		queryFn: () => api.broker.reports(),
		staleTime: REFRESH_FAST,
	});

	const notificationsQuery = useQuery({
		queryKey: ["broker", "notifications"],
		queryFn: () => api.broker.notifications(),
		staleTime: REFRESH_FAST,
	});

	// ── Derived view models ─────────────────────────────────
	const profile = profileQuery.data?.profile;

	const verification: BrokerVerificationDetails = useMemo(
		() => (profile ? toVerificationDetails(profile) : NOT_VERIFIED),
		[profile],
	);

	const profileDetails: BrokerProfileDetails = useMemo(
		() => (profile ? toProfileDetails(profile) : EMPTY_PROFILE),
		[profile],
	);

	const projects: BrokerAssignedProject[] = useMemo(
		() => (projectsQuery.data?.projects ?? []).map(toAssignedProject),
		[projectsQuery.data],
	);

	const documentRequests: BrokerDocumentRequest[] = useMemo(
		() => (requestsQuery.data?.requests ?? []).map(toDocumentRequest),
		[requestsQuery.data],
	);

	const monthlyReports: MonthlyProjectReport[] = useMemo(
		() => (reportsQuery.data?.reports ?? []).map(toMonthlyReport),
		[reportsQuery.data],
	);

	const notifications: BrokerNotification[] = useMemo(
		() => (notificationsQuery.data?.notifications ?? []).map(toNotification),
		[notificationsQuery.data],
	);

	// ── Mutations ───────────────────────────────────────────
	const invalidateProjects = () =>
		queryClient.invalidateQueries({ queryKey: ["broker", "projects"] });
	const invalidateRequests = () =>
		queryClient.invalidateQueries({
			queryKey: ["broker", "document-requests"],
		});
	const invalidateNotifications = () =>
		queryClient.invalidateQueries({ queryKey: ["broker", "notifications"] });

	const { mutate: respond, mutateAsync: respondAsync } = useMutation({
		mutationFn: ({
			projectId,
			action,
			reason,
			message,
		}: {
			projectId: string;
			action: "ACCEPT" | "DECLINE" | "REQUEST_INFORMATION";
			reason?: string;
			message?: string;
		}) =>
			api.broker.respondAssignment(numeric(projectId), {
				action,
				reason,
				message,
			}),
		onSuccess: () => {
			invalidateProjects();
			invalidateNotifications();
		},
	});

	const { mutate: saveWorkflowStatus } = useMutation({
		mutationFn: ({
			projectId,
			status,
		}: {
			projectId: string;
			status: BrokerProjectWorkflowStatus;
		}) => api.broker.updateProjectStatus(numeric(projectId), status),
		onSuccess: () => {
			invalidateProjects();
			invalidateNotifications();
		},
	});

	const { mutate: saveBond } = useMutation({
		mutationFn: ({
			projectId,
			status,
			serialNumber,
			amount,
			tenorMonths,
			couponRatePercent,
			issuanceDate,
			maturityDate,
		}: {
			projectId: string;
			status: ExternalBondIssuanceStatus;
			serialNumber?: string;
			amount?: number;
			tenorMonths?: number;
			couponRatePercent?: number;
			issuanceDate?: string;
			maturityDate?: string;
		}) =>
			api.broker.updateBond(numeric(projectId), {
				status,
				serialNumber,
				amount,
				tenorMonths,
				couponRatePercent,
				issuanceDate,
				maturityDate,
			}),
		onSuccess: () => {
			invalidateProjects();
			invalidateNotifications();
		},
	});

	const { mutate: requestDocument } = useMutation({
		mutationFn: (body: {
			projectId: string;
			category: DocumentCategory;
			documentTypeName: string;
			reason: string;
			deadlineDate: string;
			requiredPeriod?: string;
			additionalNotes?: string;
		}) =>
			api.broker.createDocumentRequest({
				...body,
				projectId: numeric(body.projectId),
			}),
		onSuccess: () => {
			invalidateRequests();
			invalidateProjects();
		},
	});

	const { mutate: review } = useMutation({
		mutationFn: ({
			requestId,
			action,
			reason,
		}: {
			requestId: string;
			action: "START_REVIEW" | "APPROVE" | "REJECT";
			reason?: string;
		}) => api.broker.reviewDocument(numeric(requestId), { action, reason }),
		onSuccess: () => {
			invalidateRequests();
			invalidateProjects();
		},
	});

	const { mutate: saveProfileRequest } = useMutation({
		mutationFn: (input: ProfileSaveInput) =>
			api.broker.saveProfile({
				companyName: input.companyName ?? profileDetails.companyName,
				description: input.description ?? profileDetails.description,
				representative: input.representative ?? profileDetails.representative,
				contactEmail: input.contactEmail ?? profileDetails.contactEmail,
				contactPhone: input.contactPhone ?? profileDetails.contactPhone,
				website: input.website ?? profileDetails.website,
				address: input.address ?? profileDetails.address,
				nib: input.nib ?? verification.nib,
				financialLicenseNumber:
					input.financialLicenseNumber ?? verification.financialLicenseNumber,
				licenseAuthority:
					input.licenseAuthority ?? verification.licenseAuthority,
			}),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["broker", "profile"] }),
	});

	const { mutate: markNotificationReadRequest } = useMutation({
		mutationFn: (id: number) => api.broker.readNotification(id),
		onSuccess: () => invalidateNotifications(),
	});

	// ── Workload metrics (§9) ───────────────────────────────
	const metrics = useMemo(() => {
		const openStatuses = projects.filter(
			(project) =>
				project.workflowStatus !== "DECLINED" &&
				project.workflowStatus !== "COMPLETED",
		);
		return {
			assignedProjectsCount: projects.filter((project) => project.isAccepted)
				.length,
			awaitingReviewCount: documentRequests.filter(
				(request) =>
					request.status === "SUBMITTED" || request.status === "UNDER_REVIEW",
			).length,
			outstandingRequestsCount: documentRequests.filter(
				(request) =>
					request.status === "REQUESTED" ||
					request.status === "REJECTED" ||
					request.status === "RESUBMISSION",
			).length,
			inBondProcessingCount: openStatuses.filter(
				(project) =>
					project.workflowStatus === "READY_FOR_BOND_ISSUANCE" ||
					project.workflowStatus === "BOND_ISSUANCE",
			).length,
			underMonitoringCount: projects.filter(
				(project) => project.workflowStatus === "MONITORING",
			).length,
		};
	}, [projects, documentRequests]);

	return {
		isLoading:
			profileQuery.isLoading ||
			projectsQuery.isLoading ||
			reportsQuery.isLoading,
		verification,
		profile: profileDetails,
		projects,
		documentRequests,
		monthlyReports,
		notifications,
		metrics,
		/** Accepting, declining (reason required) or asking for information (§21). */
		acceptAssignment: (projectId: string) =>
			respond({ projectId, action: "ACCEPT" }),
		declineAssignment: (projectId: string, reason: string) =>
			respond({ projectId, action: "DECLINE", reason }),
		requestInformation: (projectId: string, message: string) =>
			respondAsync({ projectId, action: "REQUEST_INFORMATION", message }),
		/** Move the project along the broker lifecycle (§20). */
		updateWorkflowStatus: (
			projectId: string,
			status: BrokerProjectWorkflowStatus,
		) => saveWorkflowStatus({ projectId, status }),
		updateBondStatus: (
			projectId: string,
			status: ExternalBondIssuanceStatus,
			serialNumber?: string,
		) => saveBond({ projectId, status, serialNumber }),
		updateBondDetails: (
			projectId: string,
			body: {
				status: ExternalBondIssuanceStatus;
				serialNumber?: string;
				amount?: number;
				tenorMonths?: number;
				couponRatePercent?: number;
				issuanceDate?: string;
				maturityDate?: string;
			},
		) => saveBond({ projectId, ...body }),
		createDocumentRequest: (
			projectId: string,
			category: DocumentCategory,
			documentTypeName: string,
			reason: string,
			deadlineDate: string,
			requiredPeriod?: string,
			additionalNotes?: string,
		) =>
			requestDocument({
				projectId,
				category,
				documentTypeName,
				reason,
				deadlineDate,
				requiredPeriod,
				additionalNotes,
			}),
		startReview: (requestId: string) =>
			review({ requestId, action: "START_REVIEW" }),
		approveDocument: (requestId: string) =>
			review({ requestId, action: "APPROVE" }),
		rejectDocument: (requestId: string, reason: string) =>
			review({ requestId, action: "REJECT", reason }),
		/** File licence data; the platform then verifies the broker (§6). */
		uploadBrokerVerificationDocs: (
			legalName: string,
			nib: string,
			licenseNo: string,
			authority: string,
		) =>
			saveProfileRequest({
				...profileDetails,
				companyName: legalName,
				nib,
				financialLicenseNumber: licenseNo,
				licenseAuthority: authority,
			}),
		saveProfile: (body: ProfileSaveInput) => saveProfileRequest(body),
		markNotificationRead: (notifId: string) =>
			markNotificationReadRequest(numeric(notifId)),
	};
}
