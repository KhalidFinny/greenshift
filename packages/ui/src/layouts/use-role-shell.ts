import type { AuthUser } from "@greenshift/core";
import { roleHome, useAuth } from "@greenshift/core";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export interface RoleShellData {
	user: AuthUser | null;
	name: string;
	initials: string;
	homeHref: string;
	activePath: string;
	accountRef: RefObject<HTMLDivElement | null>;
	accountMenuOpen: boolean;
	toggleAccountMenu: () => void;
	closeAccountMenu: () => void;
	openProfile: () => void;
	handleLogout: () => Promise<void>;
}

function initialsOf(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

export function useRoleShell(): RoleShellData {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const activePath = useRouterState({
		select: (state) => state.location.pathname,
	});
	const name = user?.name ?? "";
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const accountRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!accountMenuOpen) return;

		function onPointerDown(event: PointerEvent) {
			if (
				accountRef.current &&
				!accountRef.current.contains(event.target as Node)
			) {
				setAccountMenuOpen(false);
			}
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setAccountMenuOpen(false);
		}

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [accountMenuOpen]);

	const closeAccountMenu = () => setAccountMenuOpen(false);

	return {
		user,
		name,
		initials: initialsOf(name),
		homeHref: user ? roleHome[user.role] : "/",
		activePath,
		accountRef,
		accountMenuOpen,
		toggleAccountMenu: () => setAccountMenuOpen((open) => !open),
		closeAccountMenu,
		openProfile: () => {
			closeAccountMenu();
			navigate({ to: "/profile" });
		},
		handleLogout: async () => {
			closeAccountMenu();
			await logout();
		},
	};
}
