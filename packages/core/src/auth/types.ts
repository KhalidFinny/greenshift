import type { UserRole } from "@greenshift/api";

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	/**
	 * R2 object key of the account picture, or null when none is set. Serves as
	 * both the "has a picture" signal and the cache-buster on the image URL.
	 */
	avatarKey: string | null;
}
