export const companyVerificationStatuses = [
	"NOT_VERIFIED",
	"NEEDS_RESCAN",
	"PENDING",
	"REJECTED",
	"VERIFIED",
] as const;
export type CompanyVerificationStatus =
	(typeof companyVerificationStatuses)[number];

export const companyDocumentSlots = ["akta", "siup"] as const;
export type CompanyDocumentSlot = (typeof companyDocumentSlots)[number];

/** Shown identically on the company's own screen and the administrator's review. */
export const companyDocumentLabels: Record<CompanyDocumentSlot, string> = {
	akta: "Deed of incorporation (Akta Pendirian)",
	siup: "Trading licence (SIUP)",
};

/** What a vendor files to prove it is a real EPC or ESCO. */
export const vendorCertificateLabel =
	"Industry certification (ESCO licence or ISO energy management)";

/** The model only reads; the comparison against the account happens in code. */
export interface CompanyDocumentScan {
	verdict: "PASSED" | "MISMATCH" | "UNREADABLE";
	/** The document type the model read it as, in its own words. */
	documentType: string | null;
	/** The company name the document states, as it states it. */
	companyName: string | null;
	/** The registration or tax number the document states, as it states it. */
	registrationNumber: string | null;
	/** Why the verdict came out as it did, in one sentence for the company. */
	note: string;
	model: string | null;
	at: string | null;
}

export interface CompanyDocument {
	slot: CompanyDocumentSlot;
	/** The words the slot is shown under. */
	label: string;
	fileName: string | null;
	sizeBytes: number | null;
	uploadedAt: string | null;
	/** Where the filed file is served from, or null when the slot is empty. */
	downloadUrl: string | null;
	/** The scan's reading of this certificate, or null while it has not run. */
	scan: CompanyDocumentScan | null;
}

export interface CompanyVerification {
	status: CompanyVerificationStatus;
	/** The organization's details as they are on file, for the company to confirm. */
	companyName: string | null;
	industrySector: string | null;
	address: string | null;
	representative: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	nib: string | null;
	npwp: string | null;
	submittedAt: string | null;
	verifiedAt: string | null;
	rejectionReason: string | null;
	documents: CompanyDocument[];
	/** What the account still has to do before it can be filed. */
	missing: string[];
	/** How many clearer scans the company may still file before an administrator takes over. */
	rescansLeft: number;
}

/** Body of `PUT /api/business/verification`: the details the company confirms. */
export interface CompanyVerificationBody {
	companyName: string;
	industrySector: string;
	address: string;
	representative: string;
	contactPhone: string;
	nib: string;
	npwp: string;
}

export interface CompanyVerificationResponse {
	verification: CompanyVerification;
}
