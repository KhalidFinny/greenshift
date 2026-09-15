import { useEffect, useRef } from "react";
import { publishToast } from "../toast-bus";
import { useAuth } from "./use-auth";

/**
 * Client-side inactivity window for authenticated sessions. Mirrors the
 * server default in apps/api/src/lib/session.ts: keep both in sync. The
 * server value can be shortened via the SESSION_IDLE_MINUTES env var for
 * demo/testing; the server check then enforces earlier than this watcher.
 */
export const SESSION_IDLE_MS = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
	"pointerdown",
	"keydown",
	"touchstart",
	"wheel",
	"scroll",
] as const;

/**
 * Logs the user out after SESSION_IDLE_MS without activity and bounces to
 * /login. Also expires immediately when the tab regains focus/visibility
 * after having been away past the window (covers "came back to a stale
 * session"). Mount once inside the authenticated area (src/routes/_auth.tsx).
 */
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
			// Logout is silent here: the request layer's generic "Berhasil
			// keluar" toast would be misleading for an expiry kick. On success
			// the router invalidate (inside logout) re-runs the guards and
			// redirects to /login as an SPA transition, so this toast and the
			// page state survive. Hard navigation only when the server is
			// unreachable / the session is already gone.
			try {
				await logoutRef.current(true);
			} catch {
				window.location.assign("/login");
			}
			publishToast({
				tone: "info",
				title: "Sesi berakhir",
				message:
					"Anda tidak aktif selama beberapa menit. Silakan masuk kembali.",
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
		// Poll as a backstop (interval timers are throttled in background
		// tabs, so the visibility handler does the heavy lifting there).
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
