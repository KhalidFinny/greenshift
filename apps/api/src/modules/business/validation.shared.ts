// The vocabulary and limits the wizard's field rules share.

/** Field name to message, as returned in `error.fields`. */
export type FieldErrors = Record<string, string>;

/** The closed set of collateral forms, mirroring the frontend's `JAMINAN_OPTIONS`. */
export const JAMINAN_OPTIONS = [
	"Land or building certificate",
	"Machinery and equipment",
	"Trade receivables",
	"Corporate guarantee / letter of comfort",
] as const;

/** Quarter plus year, e.g. "Q1 2026". */
export const TIMELINE_RE = /^Q[1-4]\s+\d{4}$/i;

export const RINGKASAN_MIN = 50;
export const RINGKASAN_MAX = 1000;
export const TENOR_MIN = 1;
export const TENOR_MAX = 30;

export const CONSENT_MESSAGE = "Both boxes must be ticked to submit.";

export function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

export function isNonNegative(value: unknown): value is number {
	return isFiniteNumber(value) && value >= 0;
}

export function isJaminan(value: unknown): boolean {
	return (
		typeof value === "string" &&
		(JAMINAN_OPTIONS as readonly string[]).includes(value)
	);
}

// Whether a field is worth checking: always on submit, and on autosave only when the client sent a value.
export function checker(partial: boolean) {
	return (value: Record<string, unknown>, key: string) =>
		!partial || (value[key] !== undefined && value[key] !== null);
}

export function validationSummary(count: number): string {
	return count === 1
		? "1 field is not valid."
		: `${count} fields are not valid.`;
}
