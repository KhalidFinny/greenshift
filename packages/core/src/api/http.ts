import { ApiError } from "./errors";

type ErrorBody = { error?: { code?: string; message?: string } } | null;
type CsrfBody = { csrfToken?: string } | null;

const REQUEST_TIMEOUT_MS = 2 * 60 * 1000;
const SAFE_METHODS: Record<string, true> = {
	GET: true,
	HEAD: true,
	OPTIONS: true,
};

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
				body?.error?.message ?? `Permintaan gagal (${res.status})`,
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
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const method = (init?.method ?? "GET").toUpperCase();
		const headers = new Headers(init?.headers);
		if (!headers.has("Content-Type") && !SAFE_METHODS[method]) {
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
			throw new ApiError(
				res.status,
				body?.error?.message ?? `Permintaan gagal (${res.status})`,
			);
		}
		return res.json() as Promise<T>;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			throw new ApiError(504, "Waktu permintaan habis, coba lagi");
		}
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}
