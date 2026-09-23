// The broker prepares the project for issuance; sale and escrow happen outside GreenShift.
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

/** Progress comes from the project's milestones, energy and carbon from its MRV report. */
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
