import { ApiError } from "./errors";

type ErrorBody = { error?: { code?: string; message?: string } } | null;

// Abort requests that hang longer than this (2 minutes).
const REQUEST_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Shared network helper for the single GreenShift API (same origin).
 * Throws ApiError with the API's error message on non-2xx responses, and a
 * 504 ApiError when the request exceeds REQUEST_TIMEOUT_MS.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(path, {
			...init,
			credentials: "same-origin",
			headers: { "Content-Type": "application/json", ...init?.headers },
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
