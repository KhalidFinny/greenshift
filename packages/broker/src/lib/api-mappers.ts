import type {
	BrokerAssignedProject,
	BrokerDocumentRequest,
	BrokerMonthlyReport,
	BrokerNotification,
	BrokerProfile,
} from "@greenshift/api/contracts";
import { relativeTime } from "@greenshift/ui";

import type {
	BrokerAssignedProject as BrokerAssignedProjectView,
	BrokerDocumentRequest as BrokerDocumentRequestView,
	BrokerNotification as BrokerNotificationView,
	BrokerProfileDetails,
	BrokerProjectWorkflowStatus,
	BrokerVerificationDetails,
	BrokerVerificationStatus,
	DocumentRequestStatus,
	ExternalBondIssuanceStatus,
	MonthlyProjectReport,
} from "./types";

/**
 * The UI model keeps string identifiers (route parameters are strings) and
 * relative timestamps; everything else mirrors the API contract.
 */
function id(value: number): string {
	return String(value);
}

export function toProfileDetails(profile: BrokerProfile): BrokerProfileDetails {
	return {
		companyName: profile.companyName,
		description: profile.description ?? "",
		representative: profile.representative ?? "",
		contactEmail: profile.contactEmail ?? "",
		contactPhone: profile.contactPhone ?? "",
		website: profile.website ?? "",
		address: profile.address ?? "",
	};
}

export function toVerificationDetails(
	profile: BrokerProfile,
): BrokerVerificationDetails {
	return {
		status: profile.verificationStatus as BrokerVerificationStatus,
		legalEntityName: profile.companyName,
		nib: profile.nib ?? undefined,
		financialLicenseNumber: profile.financialLicenseNumber ?? undefined,
		licenseAuthority: profile.licenseAuthority ?? undefined,
		rejectionReason: profile.rejectionReason ?? undefined,
		submittedAt: profile.submittedAt ?? undefined,
		verifiedAt: profile.verifiedAt ?? undefined,
	};
}

export function toAssignedProject(
	project: BrokerAssignedProject,
): BrokerAssignedProjectView {
	return {
		id: id(project.id),
		title: project.title,
		companyName: project.companyName,
		companyEmail: project.companyEmail,
		vendorName: project.vendorName ?? "",
		industrySector: project.industrySector ?? "",
		location: project.location ?? "",
		projectValue: project.projectValue,
		lvvGrkStatus: project.lvvGrkStatus,
		lvvGrkVerificationDate: project.lvvGrkVerificationDate ?? undefined,
		blueprintStatus: project.blueprintStatus,
		workflowStatus: project.workflowStatus as BrokerProjectWorkflowStatus,
		riskAssessment: {
			overallRiskLevel: (project.riskAssessment.overallRiskLevel ?? "Medium") as
				| "Low"
				| "Medium"
				| "High",
			financialRisk: (project.riskAssessment.financialRisk ?? "Medium") as
				| "Low"
				| "Medium"
				| "High",
			technicalRisk: (project.riskAssessment.technicalRisk ?? "Medium") as
				| "Low"
				| "Medium"
				| "High",
			implementationRisk: (project.riskAssessment.implementationRisk ??
				"Medium") as "Low" | "Medium" | "High",
			environmentalRisk: (project.riskAssessment.environmentalRisk ??
				"Medium") as "Low" | "Medium" | "High",
			notes: project.riskAssessment.notes ?? "",
		},
		bondInfo: {
			status: project.bondInfo.status as ExternalBondIssuanceStatus,
			bondSerialNumber: project.bondInfo.bondSerialNumber ?? undefined,
			totalAmount: project.bondInfo.totalAmount,
			tenorMonths: project.bondInfo.tenorMonths ?? 0,
			couponRatePercent: project.bondInfo.couponRatePercent ?? 0,
			issuanceDate: project.bondInfo.issuanceDate ?? undefined,
			maturityDate: project.bondInfo.maturityDate ?? undefined,
			brokerRepresentative: project.bondInfo.brokerRepresentative ?? "",
		},
		assignedAt: project.assignedAt,
		isAccepted: project.isAccepted,
		declineReason: project.declineReason ?? undefined,
		informationRequest: project.informationRequest,
		outstandingRequestsCount: project.outstandingRequestsCount,
		lastReportDate: project.lastReportDate ?? undefined,
		description: project.description ?? "",
		financialProjections: {
			irrPercent: project.financialProjections.irrPercent ?? 0,
			npvAmount: project.financialProjections.npvAmount ?? 0,
			paybackYears: project.financialProjections.paybackYears ?? 0,
		},
		documents: project.documents.map((document) => ({
			id: id(document.id),
			type: document.type,
			fileName: document.fileName,
			fileUrl: document.fileUrl,
			uploadedAt: document.uploadedAt.slice(0, 10),
		})),
		milestones: project.milestones.map((milestone) => ({
			id: id(milestone.id),
			stepNumber: milestone.stepNumber,
			title: milestone.title,
			status: milestone.status,
			completionPercent: milestone.completionPercent ?? 0,
			startDate: milestone.startDate?.slice(0, 10) ?? null,
			dueDate: milestone.dueDate?.slice(0, 10) ?? null,
		})),
	};
}

export function toDocumentRequest(
	request: BrokerDocumentRequest,
): BrokerDocumentRequestView {
	return {
		id: id(request.id),
		projectId: id(request.projectId),
		projectTitle: request.projectTitle,
		companyName: request.companyName,
		category: request.category as BrokerDocumentRequestView["category"],
		documentTypeName: request.documentTypeName,
		requiredPeriod: request.requiredPeriod ?? undefined,
		reason: request.reason,
		deadlineDate: request.deadlineDate ?? "",
		additionalNotes: request.additionalNotes ?? undefined,
		status: request.status as DocumentRequestStatus,
		submittedFileName: request.submittedFileName ?? undefined,
		submittedFileUrl: request.submittedFileUrl ?? undefined,
		submittedAt: request.submittedAt?.slice(0, 10),
		rejectionReason: request.rejectionReason ?? undefined,
		reviewedAt: request.reviewedAt?.slice(0, 10),
	};
}

export function toMonthlyReport(
	report: BrokerMonthlyReport,
): MonthlyProjectReport {
	return {
		id: id(report.id),
		projectId: id(report.projectId),
		projectTitle: report.projectTitle,
		companyName: report.companyName,
		vendorName: report.vendorName ?? "",
		period: report.period,
		overallStatus:
			report.overallStatus as MonthlyProjectReport["overallStatus"],
		plannedProgressPercent: report.plannedProgressPercent,
		actualProgressPercent: report.actualProgressPercent,
		completedMilestonesCount: report.completedMilestonesCount,
		currentMilestoneTitle: report.currentMilestoneTitle ?? "-",
		plannedBudgetAmount: report.plannedBudgetAmount,
		actualSpendingAmount: report.actualSpendingAmount,
		expectedEnergySavingsKwh: report.expectedEnergySavingsKwh,
		actualEnergySavingsKwh: report.actualEnergySavingsKwh,
		expectedCarbonReductionTons: report.expectedCarbonReductionTons,
		actualCarbonReductionTons: report.actualCarbonReductionTons,
		projectedRoiPercent: report.projectedRoiPercent,
		actualRoiPerformancePercent: report.actualRoiPerformancePercent,
		detectedRisksOrAnomalies: report.detectedRisksOrAnomalies,
		overallConclusion: report.overallConclusion,
		submittedAt: report.submittedAt,
		pdfExportUrl: report.pdfPath,
	};
}

export function toNotification(
	notification: BrokerNotification,
): BrokerNotificationView {
	return {
		id: id(notification.id),
		category: (notification.category.charAt(0).toUpperCase() +
			notification.category.slice(1)) as BrokerNotificationView["category"],
		title: notification.title,
		message: notification.message ?? "",
		timestamp: relativeTime(notification.createdAt),
		isRead: notification.isRead,
		linkUrl: notification.linkUrl ?? "/broker",
	};
}
