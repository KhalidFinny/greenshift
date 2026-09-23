import { useEffect, useRef } from "react";
import { publishToast } from "../toast-bus";
import { useAuth } from "./use-auth";

/** Mirrors the server default in apps/api/src/lib/session.ts; keep in sync. */
export const SESSION_IDLE_MS = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
	"pointerdown",
	"keydown",
	"touchstart",
	"wheel",
	"scroll",
] as const;

/** Logs out after SESSION_IDLE_MS of inactivity, including a tab returning to focus past the window. */
export function useIdleSessionExpiry(): void {
	const { logout } = useAuth();
	const lastActiveRef = useRef<number>(Date.now());
	const expiringRef = useRef(false);
	const logoutRef = useRef(logout);
	logoutRef.current = logout;

	useEffect(() => {
		const markActive = () => {
			lastActiveRef.current = Date.now();
		};
		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, markActive, {
				passive: true,
				capture: true,
			});
		}

		const expire = async () => {
			if (expiringRef.current) return;
			expiringRef.current = true;
			// Silent: the request layer's "Signed out" toast would be misleading for a kick.
			try {
				await logoutRef.current(true);
			} catch {
				window.location.assign("/login");
			}
			publishToast({
				tone: "info",
				title: "Session expired",
				message:
					"You have been inactive for several minutes. Please sign in again.",
			});
		};

		const checkIdle = () => {
			if (Date.now() - lastActiveRef.current >= SESSION_IDLE_MS) {
				void expire();
			}
		};
		const onVisibility = () => {
			if (document.visibilityState === "visible") checkIdle();
		};

		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("focus", checkIdle);
		// Poll backstop: background tabs throttle interval timers, so visibility does the work there.
		const timer = window.setInterval(checkIdle, 10_000);

		return () => {
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, markActive, { capture: true });
			}
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("focus", checkIdle);
			window.clearInterval(timer);
		};
	}, []);
}
