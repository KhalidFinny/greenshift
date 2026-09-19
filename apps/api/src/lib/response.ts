import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiEnv } from "../env";

/**
 * The single source of truth for every failure the API can return: the HTTP
 * status and the canonical client-facing message per code. Routes pass their
 * own message only when the specific case says more than the generic one
 * (which resource was missing, which state blocked the write).
 *
 * The codes are part of the public contract (`ApiErrorCode` is re-exported
 * from `contracts.ts`), so clients can branch on `error.code` instead of
 * matching message text.
 */
export const apiErrorCodes = {
	// ── request shape ───────────────────────────────────────
	VALIDATION: { status: 400, message: "Invalid input" },
	INVALID_ID: { status: 400, message: "Invalid ID" },
	INVALID_STATUS: { status: 400, message: "Invalid status" },
	UNSUPPORTED_MEDIA_TYPE: {
		status: 415,
		message: "Content-Type must be application/json",
	},
	PAYLOAD_TOO_LARGE: { status: 413, message: "Payload too large" },
	RATE_LIMITED: {
		status: 429,
		message: "Too many attempts, please try again later",
	},

	// ── authentication and authorization ────────────────────
	UNAUTHORIZED: { status: 401, message: "Invalid session" },
	INVALID_CREDENTIALS: {
		status: 401,
		message: "Email or password is incorrect",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have access to this resource",
	},
	CSRF_REJECTED: { status: 403, message: "Invalid CSRF token" },
	VERIFICATION_REQUIRED: {
		status: 403,
		message: "Vendor profile has not been verified by an admin",
	},
	STEP_UP_REQUIRED: {
		status: 428,
		message: "Password confirmation is required for this sensitive action",
	},

	// ── missing resources ───────────────────────────────────
	NOT_FOUND: { status: 404, message: "Resource not found" },

	// ── conflicting state ───────────────────────────────────
	CONFLICT: { status: 409, message: "Conflict" },
	INVALID_STATE: {
		status: 409,
		message: "This action has already been handled",
	},
	EMAIL_TAKEN: { status: 409, message: "Email already registered" },
	TENDER_CLOSED: { status: 409, message: "Tender already closed" },
	TENDER_DEADLINE: { status: 409, message: "Tender deadline has passed" },
	DUPLICATE_PROPOSAL: {
		status: 409,
		message: "You have already submitted a proposal for this tender",
	},
	PROPOSAL_CONFLICT: {
		status: 409,
		message:
			"Proposal could not be submitted: the tender is closed or a proposal already exists",
	},
	PROPOSAL_LOCKED: {
		status: 409,
		message: "Proposal has already been processed and cannot be edited",
	},
	REVISION_LIMIT: { status: 409, message: "Revision limit reached" },
	ALREADY_PAID: { status: 409, message: "Payment already processed" },
	INVALID_TRANSITION: { status: 422, message: "Invalid status transition" },
	BLUEPRINT_INCOMPLETE: {
		status: 422,
		message: "Blueprint is not yet complete for publication",
	},

	// ── server ──────────────────────────────────────────────
	INTERNAL: { status: 500, message: "An internal error occurred" },
} as const;

export type ApiErrorCode = keyof typeof apiErrorCodes;

/**
 * A failure raised from middleware or from code that cannot return a response.
 * `app.onError` renders it as the same envelope `apiError` produces, so the
 * client sees one contract whether a handler returned or threw.
 */
export class ApiFailure extends Error {
	constructor(
		readonly code: ApiErrorCode,
		message?: string,
		readonly retryAfterSeconds?: number,
	) {
		super(message ?? apiErrorCodes[code].message);
		this.name = "ApiFailure";
	}
}

/**
 * Error envelope: `{ error: { code, message } }` with the status registered
 * for the code. Pass `message` to describe the specific case.
 */
export function apiError(
	c: Context<ApiEnv>,
	code: ApiErrorCode,
	message?: string,
): Response {
	const spec = apiErrorCodes[code];
	return c.json(
		{ error: { code, message: message ?? spec.message } },
		spec.status,
	);
}

/** `NOT_FOUND` naming the resource, e.g. "Proposal not found". */
export function apiNotFound(c: Context<ApiEnv>, resource?: string): Response {
	return apiError(
		c,
		"NOT_FOUND",
		resource ? `${resource} not found` : undefined,
	);
}

/**
 * Success body with an optional user-facing message, used by mutations so the
 * toast copy lives with the endpoint that produced it. The message is additive:
 * callers read their payload keys as before.
 */
export function apiSuccess<TData extends object>(
	c: Context<ApiEnv>,
	data: TData,
	message?: string,
	status: ContentfulStatusCode = 200,
): Response {
	return c.json(message === undefined ? data : { ...data, message }, status);
}
