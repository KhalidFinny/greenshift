/** Toast channel between the API client and the UI, so the request layer emits toasts without a UI dependency. */
export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
	tone?: ToastTone;
	title?: string;
	message: string;
}

type ToastListener = (toast: ToastMessage) => void;

/** Persisted so an undismissed toast survives a page load; cleared at sign-out because it can name a project or an amount. */
export const TOAST_STORAGE_KEY = "greenshift:toasts";

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

export function subscribeToasts(listener: ToastListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
