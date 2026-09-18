import { useState } from "react";
import {
	initialBrokerVerification,
	sampleAssignedProjects,
	sampleBrokerNotifications,
	sampleDocumentRequests,
	sampleMonthlyReports,
	sampleWorkloadMetrics,
} from "./demo-data";
import type {
	BrokerAssignedProject,
	BrokerDocumentRequest,
	BrokerNotification,
	BrokerVerificationDetails,
	DocumentCategory,
	ExternalBondIssuanceStatus,
	MonthlyProjectReport,
} from "./types";

export function useBrokerData() {
	const [verification, setVerification] = useState<BrokerVerificationDetails>(
		initialBrokerVerification,
	);
	const [projects, setProjects] =
		useState<BrokerAssignedProject[]>(sampleAssignedProjects);
	const [documentRequests, setDocumentRequests] = useState<
		BrokerDocumentRequest[]
	>(sampleDocumentRequests);
	const [monthlyReports] =
		useState<MonthlyProjectReport[]>(sampleMonthlyReports);
	const [notifications, setNotifications] = useState<BrokerNotification[]>(
		sampleBrokerNotifications,
	);

	// Accept project assignment
	const acceptAssignment = (projectId: string) => {
		setProjects((prev) =>
			prev.map((p) =>
				p.id === projectId
					? { ...p, isAccepted: true, workflowStatus: "DOCUMENT_COLLECTION" }
					: p,
			),
		);
	};

	// Decline project assignment with mandatory reason
	const declineAssignment = (projectId: string, reason: string) => {
		setProjects((prev) =>
			prev.map((p) =>
				p.id === projectId
					? {
							...p,
							isAccepted: false,
							declineReason: reason,
						}
					: p,
			),
		);
	};

	// Create new document request from Company
	const createDocumentRequest = (
		projectId: string,
		category: DocumentCategory,
		documentTypeName: string,
		reason: string,
		deadlineDate: string,
		requiredPeriod?: string,
		additionalNotes?: string,
	) => {
		const targetProject = projects.find((p) => p.id === projectId);
		if (!targetProject) return;

		const newRequest: BrokerDocumentRequest = {
			id: `doc-req-${Date.now()}`,
			projectId,
			projectTitle: targetProject.title,
			companyName: targetProject.companyName,
			category,
			documentTypeName,
			requiredPeriod,
			reason,
			deadlineDate,
			additionalNotes,
			status: "REQUESTED",
		};

		setDocumentRequests((prev) => [newRequest, ...prev]);

		// Update project outstanding count
		setProjects((prev) =>
			prev.map((p) =>
				p.id === projectId
					? {
							...p,
							outstandingRequestsCount: p.outstandingRequestsCount + 1,
						}
					: p,
			),
		);
	};

	// Approve document submission
	const approveDocument = (requestId: string) => {
		setDocumentRequests((prev) =>
			prev.map((doc) =>
				doc.id === requestId
					? {
							...doc,
							status: "APPROVED",
							reviewedAt: new Date().toISOString(),
						}
					: doc,
			),
		);
	};

	// Reject document submission with mandatory reason
	const rejectDocument = (requestId: string, reason: string) => {
		setDocumentRequests((prev) =>
			prev.map((doc) =>
				doc.id === requestId
					? {
							...doc,
							status: "REJECTED",
							rejectionReason: reason,
							reviewedAt: new Date().toISOString(),
						}
					: doc,
			),
		);
	};

	// Update high-level external bond issuance status
	const updateBondStatus = (
		projectId: string,
		newStatus: ExternalBondIssuanceStatus,
		serialNumber?: string,
	) => {
		setProjects((prev) =>
			prev.map((p) => {
				if (p.id !== projectId) return p;
				return {
					...p,
					workflowStatus:
						newStatus === "ISSUED" ? "BOND_ISSUANCE" : p.workflowStatus,
					bondInfo: {
						...p.bondInfo,
						status: newStatus,
						bondSerialNumber: serialNumber ?? p.bondInfo.bondSerialNumber,
						issuanceDate:
							newStatus === "ISSUED"
								? new Date().toISOString().split("T")[0]
								: p.bondInfo.issuanceDate,
					},
				};
			}),
		);
	};

	// Run simulated automatic broker verification
	const uploadBrokerVerificationDocs = (
		legalName: string,
		nib: string,
		licenseNo: string,
		authority: string,
	) => {
		setVerification({
			status: "VERIFYING",
			legalEntityName: legalName,
			nib,
			financialLicenseNumber: licenseNo,
			licenseAuthority: authority,
			submittedAt: new Date().toISOString(),
		});

		setTimeout(() => {
			setVerification((prev) => ({
				...prev,
				status: "VERIFIED",
				verifiedAt: new Date().toISOString(),
			}));
		}, 1500);
	};

	// Mark notification as read
	const markNotificationRead = (notifId: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
		);
	};

	// Compute active metrics
	const metrics = {
		...sampleWorkloadMetrics,
		assignedProjectsCount: projects.filter((p) => p.isAccepted).length,
		awaitingReviewCount: documentRequests.filter(
			(d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
		).length,
		outstandingRequestsCount: documentRequests.filter(
			(d) => d.status === "REQUESTED" || d.status === "REJECTED",
		).length,
		inBondProcessingCount: projects.filter(
			(p) =>
				p.workflowStatus === "READY_FOR_BOND_ISSUANCE" ||
				p.workflowStatus === "BOND_ISSUANCE",
		).length,
	};

	return {
		verification,
		projects,
		documentRequests,
		monthlyReports,
		notifications,
		metrics,
		acceptAssignment,
		declineAssignment,
		createDocumentRequest,
		approveDocument,
		rejectDocument,
		updateBondStatus,
		uploadBrokerVerificationDocs,
		markNotificationRead,
	};
}
