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
		{ to: "/business/matchmaking", label: "Vendor Matchmaking" },
	],
	// Origin wired /investor/* routes that do not exist; the built surface is
	// the public catalog at /bonds.
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
			throw redirect({ to: roleHome[context.user.role] as "/" });
	};
}

/** Where an unverified company account is held until it is verified. */
export const COMPANY_VERIFICATION_PATH = "/business/verification";

/** Client-side mirror of the API gate: an unverified business account may only
 * reach the verification step, so it is sent there instead of empty panels. */
export function requireVerifiedCompany({
	context,
	location,
}: {
	context: { user: AuthUser | null };
	location: { pathname: string };
}) {
	if (
		context.user?.role === "business" &&
		context.user.companyVerification !== "VERIFIED" &&
		location.pathname !== COMPANY_VERIFICATION_PATH
	) {
		throw redirect({ to: COMPANY_VERIFICATION_PATH });
	}
}

/** Role the dev server is scoped to (bun dev:<role> sets VITE_ROLE); undefined
 * in full-app mode. */
export function getDevRole(): UserRole | undefined {
	const raw = (import.meta.env.VITE_ROLE as string | undefined)?.trim() ?? "";
	return raw && raw in roleHome ? (raw as UserRole) : undefined;
}

/** Dev surface scope (bun dev:landing sets VITE_SCOPE=landing): landing serves
 * only the public site, everything else redirects home. */
export function getDevScope(): "landing" | undefined {
	const raw = (import.meta.env.VITE_SCOPE as string | undefined)?.trim() ?? "";
	return raw === "landing" ? "landing" : undefined;
}
