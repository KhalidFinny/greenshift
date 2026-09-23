import type {
	BrokerVerificationStatus,
	DocumentRequestStatus,
	ExternalBondIssuanceStatus,
	MonthlyReportOverallStatus,
	ProjectRiskAssessmentSummary,
} from "./types";

/** A status is a word and a hue: the chip always carries the label, so colour is
 * never the only signal, and each hue keeps one meaning across broker surfaces. */
interface StatusChip {
	label: string;
	className: string;
}

/** Monitoring verdict: emerald on track, amber needs attention, red at risk. */
export const REPORT_STATUS_META: Record<
	MonthlyReportOverallStatus,
	StatusChip
> = {
	ON_TRACK: { label: "On track", className: "bg-emerald-700 text-white" },
	ATTENTION_REQUIRED: {
		label: "Attention required",
		className: "bg-amber-700 text-white",
	},
	AT_RISK: { label: "At risk", className: "bg-red-700 text-white" },
};

/** Where a document request stands: amber awaits a party, blue is under review. */
export const DOCUMENT_REQUEST_STATUS_META: Record<
	DocumentRequestStatus,
	StatusChip
> = {
	REQUESTED: { label: "Requested", className: "bg-muted text-foreground" },
	SUBMITTED: { label: "Submitted", className: "bg-amber-700 text-white" },
	UNDER_REVIEW: { label: "Under review", className: "bg-blue-600 text-white" },
	APPROVED: { label: "Approved", className: "bg-emerald-700 text-white" },
	REJECTED: { label: "Rejected", className: "bg-red-700 text-white" },
	RESUBMISSION: {
		label: "Resubmission requested",
		className: "bg-amber-700 text-white",
	},
};

/** Issuance happens outside GreenShift, so the tracker is read, not driven. */
export const BOND_STATUS_META: Record<ExternalBondIssuanceStatus, StatusChip> =
	{
		NOT_STARTED: {
			label: "Not started",
			className: "bg-muted text-foreground",
		},
		IN_PROGRESS: { label: "In progress", className: "bg-blue-600 text-white" },
		ISSUED: { label: "Issued", className: "bg-emerald-700 text-white" },
	};

/** The brokerage licence state, as the settings page reads it. */
export const VERIFICATION_STATUS_META: Record<
	BrokerVerificationStatus,
	StatusChip
> = {
	VERIFIED: {
		label: "Officially verified",
		className: "bg-emerald-700 text-white",
	},
	VERIFYING: { label: "Verifying", className: "bg-amber-700 text-white" },
	NOT_VERIFIED: {
		label: "Not verified",
		className: "bg-muted text-foreground",
	},
	REJECTED: { label: "Changes requested", className: "bg-red-700 text-white" },
};

/** Risk severity carries the word as its value, so only the hue varies: emerald low,
 * amber moderate, red high. */
export const RISK_LEVEL_CLASS: Record<
	ProjectRiskAssessmentSummary["overallRiskLevel"],
	{ text: string; outline: string }
> = {
	Low: {
		text: "text-emerald-700",
		outline: "border-emerald-700 text-emerald-700",
	},
	Medium: {
		text: "text-amber-700",
		outline: "border-amber-700 text-amber-700",
	},
	High: {
		text: "text-red-700",
		outline: "border-red-700 text-red-700",
	},
};
