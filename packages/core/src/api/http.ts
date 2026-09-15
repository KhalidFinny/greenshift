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

/**
 * Success message per mutation route. Reads stay silent — their loading and
 * error states live in the page (skeletons / empty states).
 */
function successMessageFor(path: string, method: string): string | null {
	if (path === "/api/auth/step-up") return null; // dialog provides feedback
	if (path.endsWith("/api/auth/login")) return "Berhasil masuk";
	if (path.endsWith("/api/auth/register")) return "Akun berhasil dibuat";
	if (path.endsWith("/api/auth/logout")) return "Berhasil keluar";
	if (/\/api\/admin\/users\/\d+\/verify$/.test(path))
		return "Verifikasi pengguna diperbarui";
	if (/\/api\/admin\/vendors\/\d+\/verify$/.test(path))
		return "Verifikasi vendor diperbarui";
	if (/\/api\/admin\/projects\/\d+\/status$/.test(path))
		return "Status proyek diperbarui";
	if (/\/api\/admin\/blueprints\/\d+$/.test(path))
		return "Status blueprint diperbarui";
	if (/\/api\/admin\/roi-payments\/\d+\/payout$/.test(path))
		return "Pembayaran ROI dicairkan via escrow";
	if (path === "/api/vendor/profile" && method === "PUT")
		return "Profil vendor tersimpan";
	if (path === "/api/vendor/proposals" && method === "POST")
		return "Proposal berhasil dikirim";
	if (/\/api\/vendor\/proposals\/\d+$/.test(path)) {
		if (method === "PATCH") return "Proposal diperbarui";
		if (method === "DELETE") return "Proposal ditarik";
	}
	return "Perubahan berhasil disimpan";
}

function errorMessageFor(status: number, body: ErrorBody): string {
	return body?.error?.message ?? `Permintaan gagal (${status})`;
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
export async function request<T>(
	path: string,
	init?: RequestOptions,
): Promise<T> {
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
			const message = errorMessageFor(res.status, body);
			// 428 step-up has its own confirmation dialog; surfacing a toast
			// alongside it would be noise.
			if (res.status !== 428 && shouldToast(method, init)) {
				publishToast({ tone: "error", message });
			}
			throw new ApiError(res.status, message);
		}
		if (shouldToast(method, init)) {
			const message = successMessageFor(path, method);
			if (message) publishToast({ tone: "success", message });
		}
		return res.json() as Promise<T>;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			const method = (init?.method ?? "GET").toUpperCase();
			if (shouldToast(method, init)) {
				publishToast({
					tone: "error",
					message: "Waktu permintaan habis, coba lagi",
				});
			}
			throw new ApiError(504, "Waktu permintaan habis, coba lagi");
		}
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}
