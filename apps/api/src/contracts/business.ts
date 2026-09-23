import type { ProjectBlueprintView } from "./market";

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

export interface BusinessStep2 {
	capexRp: number;
	tenorTahun: number;
	penghematanRp: number;
	pendapatanRp: number;
	jaminan: string;
	fileIds: string[];
}

export interface BusinessStep3 {
	requirements: string[];
	deliverables: string[];
}

export type BusinessStep1Patch = Partial<{
	[K in keyof BusinessStep1]: BusinessStep1[K] | null;
}>;
export type BusinessStep2Patch = Partial<{
	[K in keyof BusinessStep2]: BusinessStep2[K] | null;
}>;
export type BusinessStep3Patch = Partial<{
	[K in keyof BusinessStep3]: BusinessStep3[K] | null;
}>;

export interface BusinessDraftBody {
	step?: 1 | 2 | 3 | 4;
	step1?: BusinessStep1Patch;
	step2?: BusinessStep2Patch;
	step3?: BusinessStep3Patch;
}

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

export interface BusinessDraftDocument {
	id: string;
	slot: string;
	fileName: string;
	sizeBytes: number | null;
	uploadedAt: string | null;
}

export interface BusinessDraftResumeResponse {
	draft: BusinessDraft;
	documents: BusinessDraftDocument[];
}

export interface BusinessSubmitBody {
	draftId: string;
	step1: BusinessStep1;
	step2: BusinessStep2;
	step3: BusinessStep3;
	consent: boolean;
	declaration: boolean;
}

export interface BusinessProjectFunding {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
	jaminan: string | null;
}

export interface BusinessSubmittedProject {
	id: number;
	title: string;
	status: string;
	statusLabel: string;
	submittedAt: string | null;
	baselineTco2: number | null;
	creditScore: number | null;
	creditRating: string | null;
	riskScore: number | null;
	riskLevel: string | null;
	location: string | null;
	sector: string | null;
	funding: BusinessProjectFunding;
	technicalRequirements: string[];
	deliverables: string[];
}

export interface BusinessSubmitResponse {
	project: BusinessSubmittedProject;
}

export interface BusinessProjectResponse {
	project: BusinessSubmittedProject;
}

export interface BusinessProjectBlueprintResponse {
	blueprint: ProjectBlueprintView | null;
}

export interface BusinessProjectRegistryResponse {
	registered: boolean;
}

export interface BusinessProjectSummary {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	status: string;
}

export interface BusinessProjectsResponse {
	projects: BusinessProjectSummary[];
}

export interface BusinessNotification {
	id: number;
	type: string;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

export interface BusinessDocument {
	id: string;
	slot: string;
	fileName: string;
	ocrStatus: string | null;
	downloadUrl?: string | null;
}

export interface BusinessDocumentResponse {
	document: BusinessDraftDocument;
}

export interface BusinessDocumentsResponse {
	documents: BusinessDocument[];
}

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

export interface BusinessProfileBody {
	companyName: string;
	representative?: string;
	industrySector?: string;
	address?: string;
	contactPhone?: string;
}

export interface BusinessProfileResponse {
	profile: BusinessProfile;
}

export interface BusinessBrokerOption {
	id: number;
	firmName: string;
	representative: string | null;
	licenseNumber: string | null;
	licenseAuthority: string | null;
	address: string | null;
}

export interface BusinessBrokersResponse {
	brokers: BusinessBrokerOption[];
}

export interface BusinessProjectBroker {
	brokerId: number;
	firmName: string;
	status: string;
	assignedAt: string;
	declineReason: string | null;
}

export interface BusinessProjectBrokerResponse {
	ready: boolean;
	assignment: BusinessProjectBroker | null;
}

export interface BusinessAssignBrokerBody {
	brokerId: number;
}

export interface BusinessAssignBrokerResponse {
	assignment: BusinessProjectBroker;
}
