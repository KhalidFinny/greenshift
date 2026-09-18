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
	notifRef: RefObject<HTMLDivElement | null>;
	notifMenuOpen: boolean;
	toggleNotifMenu: () => void;
	closeNotifMenu: () => void;
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
	const [notifMenuOpen, setNotifMenuOpen] = useState(false);

	const accountRef = useRef<HTMLDivElement | null>(null);
	const notifRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!accountMenuOpen && !notifMenuOpen) return;

		function onPointerDown(event: PointerEvent) {
			const target = event.target as Node;
			if (accountRef.current && !accountRef.current.contains(target)) {
				setAccountMenuOpen(false);
			}
			if (notifRef.current && !notifRef.current.contains(target)) {
				setNotifMenuOpen(false);
			}
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setAccountMenuOpen(false);
				setNotifMenuOpen(false);
			}
		}

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [accountMenuOpen, notifMenuOpen]);

	const closeAccountMenu = () => setAccountMenuOpen(false);
	const closeNotifMenu = () => setNotifMenuOpen(false);

	return {
		user,
		name,
		initials: initialsOf(name),
		homeHref: user ? roleHome[user.role] : "/",
		activePath,
		accountRef,
		accountMenuOpen,
		toggleAccountMenu: () => {
			setAccountMenuOpen((open) => !open);
			setNotifMenuOpen(false);
		},
		closeAccountMenu,
		notifRef,
		notifMenuOpen,
		toggleNotifMenu: () => {
			setNotifMenuOpen((open) => !open);
			setAccountMenuOpen(false);
		},
		closeNotifMenu,
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
