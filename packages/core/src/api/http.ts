import { publishToast } from "../toast-bus";
import { ApiError } from "./errors";

type ErrorBody = { error?: { code?: string; message?: string } } | null;
type CsrfBody = { csrfToken?: string } | null;

/** RequestInit plus the toast opt-out used by the typed client. */
export type RequestOptions = RequestInit & { silent?: boolean };

const REQUEST_TIMEOUT_MS = 2 * 60 * 1000;
const SAFE_METHODS: Record<string, true> = {
	GET: true,
	HEAD: true,
	OPTIONS: true,
};

function errorMessageFor(status: number, body: ErrorBody): string {
	return body?.error?.message ?? `Request failed (${status})`;
}

function shouldToast(method: string, init?: RequestOptions): boolean {
	return !SAFE_METHODS[method] && !init?.silent;
}

function shouldAttachCsrf(path: string, method: string): boolean {
	if (SAFE_METHODS[method]) return false;
	return !(
		path === "/api/auth/login" ||
		path === "/api/auth/register" ||
		path === "/api/auth/csrf"
	);
}

async function fetchCsrfToken(signal?: AbortSignal): Promise<string | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const res = await fetch("/api/auth/csrf", {
			credentials: "same-origin",
			headers: { Accept: "application/json" },
			signal: signal ?? controller.signal,
		});
		if (res.status === 401) return null;
		if (!res.ok) {
			const body = (await res.json().catch(() => null)) as ErrorBody;
			throw new ApiError(
				res.status,
				body?.error?.message ?? `Request failed (${res.status})`,
			);
		}
		const body = (await res.json().catch(() => null)) as CsrfBody;
		return typeof body?.csrfToken === "string" ? body.csrfToken : null;
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Shared network helper for the single GreenShift API (same origin).
 * Throws ApiError with the API's error message on non-2xx responses, and a
 * 504 ApiError when the request exceeds REQUEST_TIMEOUT_MS.
 */
export async function request<T>(
	path: string,
	init?: RequestOptions,
): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const method = (init?.method ?? "GET").toUpperCase();
		const headers = new Headers(init?.headers);
		// FormData must keep the browser-generated multipart boundary, so the
		// JSON default is skipped for it.
		const isFormData =
			typeof FormData !== "undefined" && init?.body instanceof FormData;
		if (!isFormData && !headers.has("Content-Type") && !SAFE_METHODS[method]) {
			headers.set("Content-Type", "application/json");
		}
		if (shouldAttachCsrf(path, method) && !headers.has("x-csrf-token")) {
			const token = await fetchCsrfToken(init?.signal ?? controller.signal);
			if (token) headers.set("x-csrf-token", token);
		}

		const res = await fetch(path, {
			...init,
			credentials: "same-origin",
			headers,
			signal: init?.signal ?? controller.signal,
		});
		if (!res.ok) {
			const body = (await res.json().catch(() => null)) as ErrorBody;
			const message = errorMessageFor(res.status, body);
			// 428 step-up has its own confirmation dialog; surfacing a toast
			// alongside it would be noise.
			if (res.status !== 428 && shouldToast(method, init)) {
				publishToast({ tone: "error", message });
			}
			throw new ApiError(res.status, message);
		}
		// Mutations carry the toast copy in the body; reads stay silent because
		// their loading and error states live in the page.
		const body = (await res.json()) as T & { message?: string };
		if (shouldToast(method, init) && body.message) {
			publishToast({ tone: "success", message: body.message });
		}
		return body;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			const method = (init?.method ?? "GET").toUpperCase();
			if (shouldToast(method, init)) {
				publishToast({
					tone: "error",
					message: "Request timed out, please try again",
				});
			}
			throw new ApiError(504, "Request timed out, please try again");
		}
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}
