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
