import { ApiError } from "./errors";

type ErrorBody = { error?: { code?: string; message?: string } } | null;

/**
 * Shared network helper for the single GreenShift API (same origin).
 * Throws ApiError with the API's error message on non-2xx responses.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		...init,
		credentials: "same-origin",
		headers: { "Content-Type": "application/json", ...init?.headers },
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => null)) as ErrorBody;
		throw new ApiError(
			res.status,
			body?.error?.message ?? `Permintaan gagal (${res.status})`,
		);
	}
	return res.json() as Promise<T>;
}
