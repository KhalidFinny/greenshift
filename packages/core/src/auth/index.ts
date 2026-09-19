import type { UserRole } from "@greenshift/api";
import { redirect } from "@tanstack/react-router";
import type { AuthUser } from "./types";

export * from "./types";
export * from "./use-auth";
export * from "./use-idle-session-expiry";

export const roleHome = {
	business: "/business",
	investor: "/bonds",
	vendor: "/vendor",
	admin: "/admin",
	broker: "/broker",
} as const satisfies Record<UserRole, string>;

export interface NavItem {
	to: string;
	label: string;
}

export const roleNav: Record<UserRole, NavItem[]> = {
	business: [
		{ to: "/business", label: "Dashboard" },
		{ to: "/business/projects", label: "My Projects" },
	],
	// Origin wired /investor, /investor/portfolio and /investor/market, but none
	// of those route files exist on either branch. The public bond catalog is
	// the surface that is actually built, so the nav points there.
	investor: [{ to: "/bonds", label: "Green Market" }],
	vendor: [
		{ to: "/vendor", label: "Dashboard" },
		{ to: "/vendor/opportunities", label: "Discover" },
		{ to: "/vendor/deals", label: "Active Deals" },
		{ to: "/vendor/portfolio", label: "Portfolio" },
	],
	broker: [
		{ to: "/broker", label: "Dashboard" },
		{ to: "/broker/projects", label: "Assigned Projects" },
		{ to: "/broker/monthly-reports", label: "Monthly Reports" },
		{ to: "/broker/settings", label: "Settings" },
	],
	admin: [
		{ to: "/admin", label: "Dashboard" },
		{ to: "/admin/analytics", label: "Analytics" },
		{ to: "/admin/projects", label: "Projects" },
		{ to: "/admin/vendors", label: "Vendors" },
		{ to: "/admin/users", label: "Users" },
		{ to: "/admin/audit-logs", label: "Audit Log" },
	],
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
