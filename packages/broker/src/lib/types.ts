export type BrokerVerificationStatus =
	| "NOT_VERIFIED"
	| "VERIFYING"
	| "VERIFIED"
	| "REJECTED";

export interface BrokerVerificationDetails {
	status: BrokerVerificationStatus;
	legalEntityName: string;
	nib?: string;
	financialLicenseNumber?: string;
	licenseAuthority?: string; // e.g. OJK / Financial Regulator
	legalDocUrl?: string;
	licenseDocUrl?: string;
	rejectionReason?: string;
	submittedAt?: string;
	verifiedAt?: string;
}

export type BrokerProjectWorkflowStatus =
	| "ASSIGNED"
	| "DECLINED"
	| "DOCUMENT_COLLECTION"
	| "UNDER_REVIEW"
	| "READY_FOR_BOND_ISSUANCE"
	| "BOND_ISSUANCE"
	| "MONITORING"
	| "COMPLETED";

export type ExternalBondIssuanceStatus =
	| "NOT_STARTED"
	| "IN_PROGRESS"
	| "ISSUED";

export interface ExternalBondInfo {
	status: ExternalBondIssuanceStatus;
	bondSerialNumber?: string;
	totalAmount: number;
	tenorMonths: number;
	couponRatePercent: number;
	issuanceDate?: string;
	maturityDate?: string;
	brokerRepresentative: string;
}

export type DocumentCategory =
	| "Legal"
	| "Financial"
	| "Project"
	| "Technical"
	| "Other";

export type DocumentRequestStatus =
	| "REQUESTED"
	| "SUBMITTED"
	| "UNDER_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "RESUBMISSION";

export interface BrokerDocumentRequest {
	id: string;
	projectId: string;
	projectTitle: string;
	companyName: string;
	category: DocumentCategory;
	documentTypeName: string;
	requiredPeriod?: string; // e.g. "2025" or "Q2 2026"
	reason: string;
	deadlineDate: string;
	additionalNotes?: string;
	status: DocumentRequestStatus;
	submittedFileName?: string;
	submittedFileUrl?: string;
	submittedAt?: string;
	rejectionReason?: string;
	reviewedAt?: string;
}

export type MonthlyReportOverallStatus =
	| "ON_TRACK"
	| "ATTENTION_REQUIRED"
	| "AT_RISK";

export interface MonthlyProjectReport {
	id: string;
	projectId: string;
	projectTitle: string;
	companyName: string;
	vendorName: string;
	period: string; // e.g. "2026-08" (August 2026)
	overallStatus: MonthlyReportOverallStatus;
	plannedProgressPercent: number;
	actualProgressPercent: number;
	completedMilestonesCount: number;
	currentMilestoneTitle: string;
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
	pdfExportUrl?: string;
}

export interface ProjectRiskAssessmentSummary {
	overallRiskLevel: "Low" | "Medium" | "High";
	financialRisk: "Low" | "Medium" | "High";
	technicalRisk: "Low" | "Medium" | "High";
	implementationRisk: "Low" | "Medium" | "High";
	environmentalRisk: "Low" | "Medium" | "High";
	notes: string;
}

export interface BrokerProjectDocument {
	id: string;
	type: string;
	fileName: string;
	fileUrl: string | null;
	uploadedAt: string;
}

export interface BrokerProjectMilestone {
	id: string;
	stepNumber: number;
	title: string;
	status: string;
	completionPercent: number;
	startDate: string | null;
	dueDate: string | null;
}

/** Firm profile shown on the broker settings page (§39). */
export interface BrokerProfileDetails {
	companyName: string;
	description: string;
	representative: string;
	contactEmail: string;
	contactPhone: string;
	website: string;
	address: string;
}

export interface BrokerAssignedProject {
	id: string;
	title: string;
	companyName: string;
	companyEmail: string;
	vendorName: string;
	industrySector: string;
	location: string;
	projectValue: number;
	lvvGrkStatus: "VERIFIED" | "PENDING";
	lvvGrkVerificationDate?: string;
	blueprintStatus?: string | null;
	workflowStatus: BrokerProjectWorkflowStatus;
	riskAssessment: ProjectRiskAssessmentSummary;
	bondInfo: ExternalBondInfo;
	assignedAt: string;
	isAccepted: boolean;
	declineReason?: string;
	informationRequest?: string | null;
	outstandingRequestsCount: number;
	lastReportDate?: string;
	description: string;
	financialProjections: {
		irrPercent: number;
		npvAmount: number;
		paybackYears: number;
	};
	/** Project documents GreenShift already holds for this project (§13). */
	documents: BrokerProjectDocument[];
	/** Delivery milestones behind the reported progress (§13). */
	milestones: BrokerProjectMilestone[];
}

export interface BrokerNotification {
	id: string;
	category: "Assignment" | "Documents" | "Project" | "Reporting" | "Bond";
	title: string;
	message: string;
	timestamp: string;
	isRead: boolean;
	linkUrl: string;
}

export interface BrokerWorkloadMetrics {
	assignedProjectsCount: number;
	awaitingReviewCount: number;
	outstandingRequestsCount: number;
	inBondProcessingCount: number;
	underMonitoringCount: number;
}
