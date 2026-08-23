import type { UserRole } from "@greenshift/api";
import { redirect } from "@tanstack/react-router";
import type { AuthUser } from "./types";

export * from "./types";
export * from "./use-auth";

export const roleHome = {
	business: "/business",
	investor: "/investor",
	vendor: "/vendor",
	admin: "/admin",
} as const satisfies Record<UserRole, string>;

export interface NavItem {
	to: string;
	label: string;
}

export const roleNav: Record<UserRole, NavItem[]> = {
	business: [{ to: "/business", label: "Business menu1" }],
	investor: [{ to: "/investor", label: "Investor menu1" }],
	vendor: [{ to: "/vendor", label: "Vendor menu1" }],
	admin: [{ to: "/admin", label: "Admin menu1" }],
};

export function requireRole(role: UserRole) {
	return ({ context }: { context: { user: AuthUser | null } }) => {
		if (!context.user) throw redirect({ to: "/login" });
		if (context.user.role !== role)
			throw redirect({ to: roleHome[context.user.role] });
	};
}

/**
 * Role the dev server is scoped to (bun dev:<role> sets VITE_ROLE).
 * Undefined in full-app mode.
 */
export function getDevRole(): UserRole | undefined {
	const raw = (import.meta.env.VITE_ROLE as string | undefined)?.trim() ?? "";
	return raw && raw in roleHome ? (raw as UserRole) : undefined;
}

/**
 * Dev surface scope (bun dev:landing sets VITE_SCOPE=landing).
 * "landing" serves only the public site; everything else redirects home.
 */
export function getDevScope(): "landing" | undefined {
	const raw = (import.meta.env.VITE_SCOPE as string | undefined)?.trim() ?? "";
	return raw === "landing" ? "landing" : undefined;
}
