/** Toast channel between the API client and the @greenshift/ui ToastProvider;
 * it lives here so the request layer emits toasts without a UI dependency. */
export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
	tone?: ToastTone;
	/** Optional heading; falls back to the tone label ("Success"/"Failed"). */
	title?: string;
	message: string;
}

type ToastListener = (toast: ToastMessage) => void;

/** Survives a page load so an undismissed toast is not lost mid-flight; cleared
 * at sign-out because the queue can name a project, a proposal or an amount. */
export const TOAST_STORAGE_KEY = "greenshift:toasts";

/** Drops the persisted queue before the router reloads on sign-out. */
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

/** Returns the unsubscribe the toast provider calls on unmount. */
export function subscribeToasts(listener: ToastListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
