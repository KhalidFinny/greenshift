/**
 * Framework-agnostic toast channel. The API client (core) publishes
 * success/failure messages here; the shared ToastProvider in @greenshift/ui
 * subscribes and renders them. Keeping the bus in core (not ui) lets the
 * request layer emit toasts without a UI dependency.
 */
export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
	tone?: ToastTone;
	/** Optional heading; falls back to the tone label ("Success"/"Failed"). */
	title?: string;
	message: string;
}

type ToastListener = (toast: ToastMessage) => void;

/**
 * Where the provider keeps the toasts that have not been dismissed yet, so a
 * full page load does not wipe one mid-flight. A toast can name a project, a
 * proposal or an amount, so the store is cleared when the session ends: the next
 * person to sign in on the same tab must not read the last one's messages.
 */
export const TOAST_STORAGE_KEY = "greenshift:toasts";

/** Drops the persisted queue. Called on sign-out, before the router reloads. */
export function clearStoredToasts(): void {
	try {
		window.sessionStorage.removeItem(TOAST_STORAGE_KEY);
	} catch {
		// Private-mode storage is unavailable; nothing was persisted to clear.
	}
}

const listeners = new Set<ToastListener>();

export function publishToast(toast: ToastMessage): void {
	for (const listener of listeners) listener(toast);
}

/** Returns an unsubscribe function. Called by the toast provider. */
export function subscribeToasts(listener: ToastListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
