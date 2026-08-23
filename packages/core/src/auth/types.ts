import type { UserRole } from "@greenshift/api";

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
}
