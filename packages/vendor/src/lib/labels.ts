import type {
	MilestoneStatus,
	ProcurementMethod,
	ProposalStatus,
	VerificationStatus,
} from "./types";

export type StatusTone = "default" | "secondary" | "destructive" | "outline";

export const PROCUREMENT_METHOD_LABEL: Record<ProcurementMethod, string> = {
	OPEN_BIDDING: "Open Bidding",
	CLOSED_BIDDING: "Closed Bidding",
	DIRECT_SELECTION: "Direct Award",
};

export const PROCUREMENT_METHOD_TONE: Record<ProcurementMethod, StatusTone> = {
	OPEN_BIDDING: "default",
	CLOSED_BIDDING: "secondary",
	DIRECT_SELECTION: "outline",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
	DRAFT: "Draft",
	SUBMITTED: "Submitted",
	UNDER_EVALUATION: "Under Evaluation",
	RANKED: "Ranked",
	SELECTED: "Selected",
	NEGOTIATION: "In Negotiation",
	AGREED: "Agreed",
	REJECTED: "Rejected",
	CLOSED: "Closed",
};

export const PROPOSAL_STATUS_TONE: Record<ProposalStatus, StatusTone> = {
	DRAFT: "outline",
	SUBMITTED: "secondary",
	UNDER_EVALUATION: "secondary",
	RANKED: "default",
	SELECTED: "default",
	NEGOTIATION: "secondary",
	AGREED: "default",
	REJECTED: "destructive",
	CLOSED: "outline",
};

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
	NOT_STARTED: "Not Started",
	IN_PROGRESS: "In Progress",
	SUBMITTED_FOR_REVIEW: "Under Review",
	APPROVED: "Approved",
	REVISION_REQUIRED: "Revision Required",
	COMPLETED: "Completed",
};

export const MILESTONE_STATUS_TONE: Record<MilestoneStatus, StatusTone> = {
	NOT_STARTED: "outline",
	IN_PROGRESS: "secondary",
	SUBMITTED_FOR_REVIEW: "secondary",
	APPROVED: "default",
	REVISION_REQUIRED: "destructive",
	COMPLETED: "default",
};

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
	NOT_VERIFIED: "Unverified",
	VERIFYING: "Verifying Documents...",
	VERIFIED: "Verified",
	REJECTED: "Rejected",
};

export const VERIFICATION_STATUS_TONE: Record<VerificationStatus, StatusTone> =
	{
		NOT_VERIFIED: "outline",
		VERIFYING: "secondary",
		VERIFIED: "default",
		REJECTED: "destructive",
	};
