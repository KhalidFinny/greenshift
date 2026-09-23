import type {
	BusinessStep1Patch,
	BusinessStep2Patch,
	BusinessStep3Patch,
} from "../../contracts";
import {
	SCOPE_ITEM_MAX,
	SCOPE_MAX_ITEMS,
	scopeEntries,
} from "./business.shared";

/**
 * The wizard's per-step rules, mirroring the frontend's `validators.ts`.
 *
 * The messages are the ones the UI shows, so they are copied rather than
 * paraphrased. The KEYS are the wire contract's field names, so the `fields`
 * map in an error response applies straight to the payload the client sent.
 *
 * `partial` is the autosave mode: only the keys the client actually sent are
 * checked, because an autosave is not a submission. An absent key means the
 * field was untouched and an explicit null means it was cleared; neither is an
 * error until submit. Autosave also skips the ringkasan minimum, which is a
 * submission requirement rather than a sanity check.
 */

/** Field name to message, as returned in `error.fields`. */
export type FieldErrors = Record<string, string>;

/** The closed set of collateral forms. Mirrors `JAMINAN_OPTIONS`. */
export const JAMINAN_OPTIONS = [
	"Land or building certificate",
	"Machinery and equipment",
	"Trade receivables",
	"Corporate guarantee / letter of comfort",
] as const;

/** Quarter plus year, e.g. "Q1 2026". */
const TIMELINE_RE = /^Q[1-4]\s+\d{4}$/i;

export const RINGKASAN_MIN = 50;
export const RINGKASAN_MAX = 1000;
export const TENOR_MIN = 1;
export const TENOR_MAX = 30;

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

/** Money and energy are non-negative finite numbers. */
function isNonNegative(value: unknown): value is number {
	return isFiniteNumber(value) && value >= 0;
}

export function isJaminan(value: unknown): boolean {
	return (
		typeof value === "string" &&
		(JAMINAN_OPTIONS as readonly string[]).includes(value)
	);
}

/**
 * Whether a field is worth checking: always on submit, and on autosave only
 * when the client actually sent a value (sent-but-null means cleared).
 */
function checker(partial: boolean) {
	return (value: Record<string, unknown>, key: string) =>
		!partial || (value[key] !== undefined && value[key] !== null);
}

export function step1Errors(
	value: BusinessStep1Patch,
	partial = false,
): FieldErrors {
	const errors: FieldErrors = {};
	const check = checker(partial);

	if (check(value, "namaProyek") && !value.namaProyek?.trim()) {
		errors.namaProyek = "Enter the project name.";
	}
	if (check(value, "lokasi") && !value.lokasi?.trim()) {
		errors.lokasi = "Enter the location.";
	}
	if (check(value, "sektor") && !value.sektor) {
		errors.sektor = "Choose a sector.";
	}
	if (check(value, "konsumsiMwh") && !isNonNegative(value.konsumsiMwh)) {
		errors.konsumsiMwh = "Enter a valid number, e.g. 12.500,5.";
	}
	if (check(value, "biayaRp") && !isNonNegative(value.biayaRp)) {
		errors.biayaRp = "Enter a valid amount in rupiah, e.g. 4.200.000.000.";
	}
	if (check(value, "faktorEmisi") && !isNonNegative(value.faktorEmisi)) {
		errors.faktorEmisi = "Enter a valid factor, e.g. 0,85.";
	}
	if (check(value, "targetPct")) {
		const pct = value.targetPct;
		if (!isFiniteNumber(pct) || pct < 0 || pct > 100) {
			errors.targetPct = "Enter a value between 0 and 100.";
		}
	}
	if (check(value, "targetMwh") && !isNonNegative(value.targetMwh)) {
		errors.targetMwh = "Enter a valid number, e.g. 8.000.";
	}
	if (
		check(value, "timeline") &&
		!TIMELINE_RE.test((value.timeline ?? "").trim())
	) {
		errors.timeline = "Use quarter + year, e.g. Q1 2026.";
	}
	if (check(value, "ringkasan")) {
		const length = value.ringkasan?.trim().length ?? 0;
		if (length > RINGKASAN_MAX) {
			errors.ringkasan = "At most 1000 characters.";
		} else if (!partial && length < RINGKASAN_MIN) {
			errors.ringkasan = "At least 50 characters.";
		}
	}

	return errors;
}

/**
 * Step 2 rules. `fileCount` is the number of documents attached to the draft;
 * the minimum of one is only enforced on submit.
 */
export function step2Errors(
	value: BusinessStep2Patch,
	partial = false,
	fileCount = 0,
): FieldErrors {
	const errors: FieldErrors = {};
	const check = checker(partial);

	if (check(value, "capexRp") && !isNonNegative(value.capexRp)) {
		errors.capexRp = "Enter a valid CAPEX, e.g. 4.200.000.000.";
	}
	if (check(value, "tenorTahun")) {
		const tenor = value.tenorTahun;
		if (
			!isFiniteNumber(tenor) ||
			!Number.isInteger(tenor) ||
			tenor < TENOR_MIN ||
			tenor > TENOR_MAX
		) {
			errors.tenorTahun = "Enter a tenor between 1 and 30 years.";
		}
	}
	if (check(value, "penghematanRp") && !isNonNegative(value.penghematanRp)) {
		errors.penghematanRp = "Enter a valid annual saving, e.g. 500.000.000.";
	}
	if (check(value, "pendapatanRp") && !isNonNegative(value.pendapatanRp)) {
		errors.pendapatanRp = "Enter a valid revenue, e.g. 10.000.000.000.";
	}
	if (check(value, "jaminan") && !isJaminan(value.jaminan)) {
		errors.jaminan = "Choose a form of collateral.";
	}
	if (!partial && fileCount < 1) {
		errors.fileIds = "Upload at least 1 document.";
	}

	return errors;
}

/**
 * Step 3 rules: the scope of work. Both lists are open-ended, so the rule counts
 * the entries that carry text rather than reading any one of them, and an empty
 * list is only an error on submit: a draft is allowed to be incomplete.
 */
export function step3Errors(
	value: BusinessStep3Patch,
	partial = false,
): FieldErrors {
	const errors: FieldErrors = {};
	const check = checker(partial);

	if (check(value, "requirements")) {
		const problem = scopeListProblem(
			value.requirements,
			"key technical requirement",
			partial,
		);
		if (problem) errors.requirements = problem;
	}
	if (check(value, "deliverables")) {
		const problem = scopeListProblem(
			value.deliverables,
			"deliverable",
			partial,
		);
		if (problem) errors.deliverables = problem;
	}

	return errors;
}

/** Why a scope list is not usable, or null when it is. */
function scopeListProblem(
	value: unknown,
	noun: string,
	partial: boolean,
): string | null {
	if (!Array.isArray(value)) return `Enter one ${noun} per line.`;
	if (
		value.some(
			(entry) =>
				typeof entry !== "string" || entry.trim().length > SCOPE_ITEM_MAX,
		)
	) {
		return `Each entry is at most ${SCOPE_ITEM_MAX} characters.`;
	}
	if (value.length > SCOPE_MAX_ITEMS) {
		return `At most ${SCOPE_MAX_ITEMS} entries.`;
	}
	if (!partial && scopeEntries(value).length === 0) {
		return `Add at least one ${noun}.`;
	}
	return null;
}

/** Both declaration flags must be ticked before a draft can be submitted. */
export const CONSENT_MESSAGE = "Both boxes must be ticked to submit.";

/** The summary shown with a validation failure, singular or plural. */
export function validationSummary(count: number): string {
	return count === 1
		? "1 field is not valid."
		: `${count} fields are not valid.`;
}
