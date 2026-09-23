import type { ProjectBlueprintView } from "./market";

/** Step 1: what the project is and what it is expected to save. */
export interface BusinessStep1 {
	namaProyek: string;
	lokasi: string;
	sektor: string;
	konsumsiMwh: number;
	biayaRp: number;
	faktorEmisi: number;
	targetPct: number;
	targetMwh: number;
	timeline: string;
	ringkasan: string;
}

/** Step 2: how it is financed. `fileIds` are draft document ids. */
export interface BusinessStep2 {
	capexRp: number;
	tenorTahun: number;
	penghematanRp: number;
	pendapatanRp: number;
	jaminan: string;
	fileIds: string[];
}

/** What a bidder is measured against; the deliverables are what it hands over. */
export interface BusinessStep3 {
	requirements: string[];
	deliverables: string[];
}

/** An absent key means untouched, an explicit `null` means cleared. */
export type BusinessStep1Patch = Partial<{
	[K in keyof BusinessStep1]: BusinessStep1[K] | null;
}>;
export type BusinessStep2Patch = Partial<{
	[K in keyof BusinessStep2]: BusinessStep2[K] | null;
}>;
export type BusinessStep3Patch = Partial<{
	[K in keyof BusinessStep3]: BusinessStep3[K] | null;
}>;

/** Body of `PUT /api/business/drafts/:draftId`. Every block is optional. */
export interface BusinessDraftBody {
	step?: 1 | 2 | 3 | 4;
	step1?: BusinessStep1Patch;
	step2?: BusinessStep2Patch;
	step3?: BusinessStep3Patch;
}

/** The stored draft, merged. Null blocks have never been touched. */
export interface BusinessDraft {
	id: string;
	step: number | null;
	updatedAt: string | null;
	step1: BusinessStep1Patch | null;
	step2: BusinessStep2Patch | null;
	step3: BusinessStep3Patch | null;
}

export interface BusinessDraftResponse {
	draft: BusinessDraft;
}

/** Named by `step2.fileIds`; the names and sizes are read from here. */
export interface BusinessDraftDocument {
	id: string;
	slot: string;
	fileName: string;
	sizeBytes: number | null;
	uploadedAt: string | null;
}

/** The draft plus its attached files, which its blocks only reference by id. */
export interface BusinessDraftResumeResponse {
	draft: BusinessDraft;
	documents: BusinessDraftDocument[];
}

/** Body of `POST /api/business/projects/submit`: every block is required. */
export interface BusinessSubmitBody {
	draftId: string;
	step1: BusinessStep1;
	step2: BusinessStep2;
	step3: BusinessStep3;
	consent: boolean;
	declaration: boolean;
}

/** The Step 2 figures read back, so the project page shows the review step's summary. */
export interface BusinessProjectFunding {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
}

/** Carries the scores the server derived; absent from the request body by design. */
export interface BusinessSubmittedProject {
	id: number;
	title: string;
	status: string;
	/** The stage in the words the app shows, e.g. "Awaiting LVV verification". */
	statusLabel: string;
	submittedAt: string | null;
	/** Tonnes of CO2e per year: consumption x emission factor. */
	baselineTco2: number | null;
	creditScore: number | null;
	creditRating: string | null;
	riskScore: number | null;
	riskLevel: string | null;
	location: string | null;
	sector: string | null;
	funding: BusinessProjectFunding;
	/** What a bidder must meet, and what the delivery hands over. */
	technicalRequirements: string[];
	deliverables: string[];
}

export interface BusinessSubmitResponse {
	project: BusinessSubmittedProject;
}

/** The submitted project as any surface reads it back. */
export interface BusinessProjectResponse {
	project: BusinessSubmittedProject;
}

/** Null until the LVV verification flow writes the document. */
export interface BusinessProjectBlueprintResponse {
	blueprint: ProjectBlueprintView | null;
}

/** The company registers at Sistem Registri itself; this reports whether it did. */
export interface BusinessProjectRegistryResponse {
	registered: boolean;
}

/** One row of the project table. `status` is the pill label, not the DB enum. */
export interface BusinessProjectSummary {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	/** "Register for LVV" | "Awaiting LVV verification" | "Matchmaking" | "Verified". */
	status: string;
}

export interface BusinessProjectsResponse {
	projects: BusinessProjectSummary[];
}

/** One row of the company feed the shell bell renders. */
export interface BusinessNotification {
	id: number;
	type: string;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

/** A file on a submitted project, after OCR has had it. `slot` is the checklist key it fills. */
export interface BusinessDocument {
	id: string;
	slot: string;
	fileName: string;
	ocrStatus: string | null;
	/** Null while OCR is still processing, so the UI can disable the action. */
	downloadUrl?: string | null;
}

export interface BusinessDocumentResponse {
	document: BusinessDraftDocument;
}

export interface BusinessDocumentsResponse {
	documents: BusinessDocument[];
}

/** `contactEmail` is read-only. */
export interface BusinessProfile {
	id: number;
	companyName: string | null;
	representative: string;
	industrySector: string | null;
	address: string | null;
	contactEmail: string;
	contactPhone: string | null;
	updatedAt: string | null;
}

/** The company name is required; an absent key keeps its stored value. */
export interface BusinessProfileBody {
	companyName: string;
	representative?: string;
	/** One of `industrySectors`. */
	industrySector?: string;
	address?: string;
	contactPhone?: string;
}

export interface BusinessProfileResponse {
	profile: BusinessProfile;
}

/** A verified broker the company may hand an awarded project to. */
export interface BusinessBrokerOption {
	/** The broker account (`users.id`), which the assignment names. */
	id: number;
	firmName: string;
	representative: string | null;
	/** The financial licence the firm filed, and the authority that issued it. */
	licenseNumber: string | null;
	licenseAuthority: string | null;
	address: string | null;
}

export interface BusinessBrokersResponse {
	brokers: BusinessBrokerOption[];
}

/** The project's broker, as the company reads the assignment back. */
export interface BusinessProjectBroker {
	brokerId: number;
	firmName: string;
	/** One of `brokerWorkflowStatuses`. */
	status: string;
	assignedAt: string;
	/** Set when the broker declined; null otherwise. */
	declineReason: string | null;
}

export interface BusinessProjectBrokerResponse {
	/** False until the project's tender is awarded; a broker can only be chosen after that. */
	awarded: boolean;
	assignment: BusinessProjectBroker | null;
}

export interface BusinessAssignBrokerBody {
	brokerId: number;
}

export interface BusinessAssignBrokerResponse {
	assignment: BusinessProjectBroker;
}
