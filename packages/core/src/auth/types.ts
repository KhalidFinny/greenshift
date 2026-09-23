import type { UserRole } from "@greenshift/api";

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	/**
	 * The organization the person registered: the company they work for, or the
	 * vendor firm they represent. Null for accounts with no organization, such as
	 * an administrator. Shown under the person's own name, so a shared screen
	 * says which entity the reader is acting as.
	 */
	companyName: string | null;
	/**
	 * R2 object key of the account picture, or null when none is set. Serves as
	 * both the "has a picture" signal and the cache-buster on the image URL.
	 */
	avatarKey: string | null;
}
