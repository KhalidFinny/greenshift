import type { CompanyVerificationStatus, UserRole } from "@greenshift/api";

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	/** The organization the person registered; null for accounts with none, such
	 * as an administrator. Shown under the person's own name. */
	companyName: string | null;
	/** R2 object key of the account picture, or null; also the cache-buster. */
	avatarKey: string | null;
	/** Null for roles verified another way (a vendor through its profile, an
	 * administrator not at all); the company surfaces gate on this. */
	companyVerification: CompanyVerificationStatus | null;
}
