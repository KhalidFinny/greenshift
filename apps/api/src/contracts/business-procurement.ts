/** The three procurement routes, in the vocabulary the tender stores. */
export const tenderMethodIds = ["open", "closed", "direct"] as const;
export type BusinessMatchmakingMethod = (typeof tenderMethodIds)[number];

export type BusinessTenderStatus = "open" | "evaluation" | "closed" | "awarded";

export interface BusinessMatchmakingProject {
	id: number;
	name: string;
	location: string | null;
	sector: string | null;
	submittedAt: string | null;
	capexRp: number | null;
	/** The pill label the list renders, from the API's `pillStatus`. */
	status: string;
	/** The vendor this project's tender was awarded to, or null until it is. */
	awardedVendor: string | null;
	/** The tender's state, so the list can send a decided project to its bids. */
	tenderStatus: BusinessTenderStatus | null;
}

/** How the pool scores on it, what it was worth, and the share it carried. */
export interface BusinessMatchFactor {
	label: string;
	pct: number;
	weight: number;
	applied: boolean;
}

export interface BusinessRecommendedVendor {
	id: number;
	name: string;
	subtitle: string;
	/** Weighted total of the five criteria, 0–100. */
	score: number;
	rank: number;
	rating: number;
	totalProjects: number;
	verified: boolean;
	/** Among the best few the company is offered to choose between. */
	shortlisted: boolean;
	/** This vendor's own reading on each criterion, best first. */
	criteria: Array<{ label: string; pct: number }>;
	/** Why this vendor ranks here, read off its own scores. */
	whyRank: string[];
}

export interface BusinessProcurementMethod {
	id: BusinessMatchmakingMethod;
	label: string;
	desc: string;
}

/** Coordinates are fractions of the page, so the mark lands at any width. */
export type ProposalMarkKind = "highlight" | "circle";

export interface ProposalAnnotation {
	id: string;
	kind: ProposalMarkKind;
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface BusinessTender {
	id: number;
	projectId: number;
	method: BusinessMatchmakingMethod;
	status: BusinessTenderStatus;
	deadlineAt: string | null;
	budgetMin: number | null;
	budgetMax: number | null;
	awardedProposalId: number | null;
	/** How many bids are in, so a list row needs no second request. */
	bidCount: number;
	awardedVendorName: string | null;
}

/** What the company asked for, where it marked the proposal, and the vendor's answer. */
export interface BusinessBidNegotiation {
	id: number;
	iterationNumber: number;
	status: string;
	companyNote: string;
	annotations: ProposalAnnotation[];
	requestedFields: string[];
	vendorRevisedPrice: number | null;
	vendorRevisedWarrantyYears: number | null;
	vendorResponseNote: string | null;
	respondedAt: string | null;
	createdAt: string;
}

export interface BusinessProcurementBid {
	id: number;
	vendorId: number;
	vendorName: string;
	amount: number;
	technicalSpec: string | null;
	operationalCost: number | null;
	projectedRoi: number | null;
	/** Months of warranty offered. */
	warrantyPeriod: number | null;
	status: string;
	revisionCount: number;
	submittedAt: string | null;
	/** The proposal PDF the vendor filed, or null when the bid carries none. */
	documentName: string | null;
	documentUrl: string | null;
	/** Every revision round on this bid, oldest first. */
	negotiations: BusinessBidNegotiation[];
}

/** Everything the matchmaking detail screen renders for one project. */
export interface BusinessMatchmakingDetail {
	project: BusinessMatchmakingProject;
	matchFactors: BusinessMatchFactor[];
	procurementMethods: BusinessProcurementMethod[];
	selectedMethod: BusinessMatchmakingMethod | null;
	selectedVendorId: number | null;
	/** Every ranked vendor, best first, each marked with whether it is shortlisted. */
	recommendedVendors: BusinessRecommendedVendor[];
	/** How many verified vendors the matching run scored. */
	poolSize: number;
	/** How many of them the shortlist holds. */
	shortlistSize: number;
	/** Absent until the company's choice opens one. */
	tender: BusinessTender | null;
	bids: BusinessProcurementBid[];
}

export interface BusinessMatchmakingListResponse {
	projects: BusinessMatchmakingProject[];
}

/** What a matching run did, so the screen can say it in words. */
export interface BusinessMatchingRunResponse {
	scored: number;
	shortlist: Array<{ vendorId: number; name: string; score: number }>;
}

export interface BusinessMatchmakingSelectionBody {
	/** Required by the direct route; open and closed invite their pool by their own rule. */
	vendorId?: number;
	method: BusinessMatchmakingMethod;
	/** When bidding closes. The tender runs until this moment. */
	deadlineAt: string;
	budgetMin?: number | null;
	budgetMax?: number | null;
}

/** Closing bidding freezes the terms and puts the tender under evaluation. */
export interface BusinessTenderCloseBody {
	action: "close";
}

export interface BusinessAwardBody {
	proposalId: number;
}

export interface BusinessBidReviewBody {
	decision: "revision" | "reject";
	/** Required when asking for a revision: the vendor is told what to change. */
	note?: string | null;
	/** Where the company marked the proposal it is asking about. */
	annotations?: ProposalAnnotation[];
}

export interface BusinessMatchmakingSelectionResponse {
	selection: {
		projectId: number;
		/** The vendor named up front, which the open and closed routes do not name. */
		vendorId: number | null;
		vendorName: string | null;
		method: BusinessMatchmakingMethod;
	};
	tender: BusinessTender;
}
