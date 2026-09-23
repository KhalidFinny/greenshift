import type { AuthUser } from "@greenshift/core";

export interface LoginBody {
	email: string;
	password: string;
}

/** What a person registers as: a company submits projects, a vendor delivers them. */
export const organizationTypes = ["company", "vendor"] as const;
export type OrganizationType = (typeof organizationTypes)[number];

/** Shared with the project submission vocabulary, so the two sectors compare. */
export const industrySectors = [
	"Cement",
	"Iron and steel",
	"Aluminium",
	"Fertiliser",
	"Textile",
	"Food and beverage",
	"Chemical",
	"Pulp and paper",
	"Machinery",
	"Automotive",
	"Commercial buildings",
	"Public sector",
	"Agriculture",
] as const;

/** What a vendor delivers. Read as vendor text by the matchmaking pool. */
export const vendorServiceCategories = [
	"ESCO",
	"Solar PV EPC",
	"Biomass and bioenergy",
	"Energy audit",
	"Boiler and steam systems",
	"Compressed air systems",
	"HVAC and chillers",
	"Waste heat recovery",
	"Lighting retrofit",
] as const;

/** Kept here so the client caps its inputs at the numbers the server rejects on. */
export const credentialLimits = { email: 254, password: 128 } as const;

/** Registration field limits, enforced on the server and mirrored by the form. */
export const registerLimits = {
	name: 120,
	phone: 32,
	organizationName: 200,
	industry: 120,
	address: 300,
	businessInfo: 2000,
	/** NIB and NPWP as they are written on the document. */
	legalId: 32,
} as const;

/** One registration for both organizations; vendor fields are optional. */
export interface RegisterBody {
	accountType: OrganizationType;
	/** The representative, not the organization. */
	name: string;
	email: string;
	password: string;
	phone: string;
	organizationName: string;
	/** Company: a sector from `industrySectors`. Vendor: a service category. */
	industry: string;
	address: string;
	/** Vendor only: what the company does, in its own words. */
	businessInfo?: string;
	/** Vendor only: legal identity, required before an admin verifies. */
	nib?: string;
	npwp?: string;
}

export interface AuthResponse {
	user: AuthUser;
}

export interface CsrfResponse {
	csrfToken: string;
	stepUpUntil: string | null;
}

export interface StepUpBody {
	password: string;
}

export interface StepUpResponse {
	ok: true;
	elevatedUntil: string;
}

export interface OkResponse {
	ok: true;
}

/** Shared with the client so both sides reject the same files. */
export const avatarLimits = {
	maxBytes: 2 * 1024 * 1024,
	mimeTypes: ["image/png", "image/jpeg", "image/webp"] as const,
};
