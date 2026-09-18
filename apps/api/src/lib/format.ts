/**
 * Formatting and parsing helpers shared by every module.
 */

export function iso(date: Date | null): string | null {
	return date?.toISOString() ?? null;
}

export function isoDate(date: Date | null): string | null {
	return date?.toISOString().slice(0, 10) ?? null;
}

export function parseLimit(raw: string | undefined, fallback = 50, max = 200) {
	const n = Number(raw ?? fallback);
	return Math.min(
		Math.max(Number.isFinite(n) ? Math.trunc(n) : fallback, 1),
		max,
	);
}

/** True when an optional numeric body field is present but out of range. */
export function invalidNumber(
	value: unknown,
	opts: { integer?: boolean; min?: number; max?: number } = {},
): boolean {
	if (value === undefined || value === null) return false;
	if (typeof value !== "number" || !Number.isFinite(value)) return true;
	if (opts.integer && !Number.isInteger(value)) return true;
	if (opts.min !== undefined && value < opts.min) return true;
	if (opts.max !== undefined && value > opts.max) return true;
	return false;
}

/** True when an optional text body field is present but too long. */
export function invalidText(value: unknown, max: number): boolean {
	return (
		value !== undefined &&
		value !== null &&
		(typeof value !== "string" || value.length > max)
	);
}

/**
 * Strict variant for bodies where an explicit JSON null is malformed rather
 * than absent (the broker endpoints validate this way).
 */
export function invalidOptionalText(value: unknown, max: number): boolean {
	return (
		value !== undefined && (typeof value !== "string" || value.length > max)
	);
}

/** Strict variant of {@link invalidNumber} for the same reason. */
export function invalidOptionalNumber(
	value: unknown,
	opts: { integer?: boolean; min?: number; max?: number } = {},
): boolean {
	return invalidNumber(value === null ? Number.NaN : value, opts);
}

/** Max length of a stored text field, used by validation guards. */
export const MAX_TEXT = 2000;
export const MAX_SHORT_TEXT = 300;
export const MAX_NAME = 200;
