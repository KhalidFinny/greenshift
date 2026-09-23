import type { ProposalAnnotation } from "../contracts";

/**
 * How many marks one revision round may carry on a proposal. A page of a
 * proposal does not need more than this to say what has to change.
 */
const MAX_ANNOTATIONS = 40;

/** A 0-1 fraction of the proposal page, or null when it is not one. */
function fraction(value: unknown): number | null {
	if (typeof value !== "number" || !Number.isFinite(value)) return null;
	return Math.min(1, Math.max(0, value));
}

/**
 * The marks a company drew on a proposal, read back as stored.
 *
 * Both sides of a revision draw these — the company over the document it is
 * asking about, the vendor over the document it must answer — so a mark that is
 * not a well-formed box on the page is dropped rather than stored: the vendor
 * would otherwise see a mark the company never made.
 */
export function readAnnotations(value: unknown): ProposalAnnotation[] {
	if (!Array.isArray(value)) return [];

	const marks: ProposalAnnotation[] = [];
	for (const raw of value.slice(0, MAX_ANNOTATIONS)) {
		if (raw === null || typeof raw !== "object") continue;
		const mark = raw as Record<string, unknown>;
		if (typeof mark.id !== "string" || mark.id.length === 0) continue;
		const kind =
			mark.kind === "circle"
				? "circle"
				: mark.kind === "highlight"
					? "highlight"
					: null;
		if (kind === null) continue;

		const x = fraction(mark.x);
		const y = fraction(mark.y);
		const w = fraction(mark.w);
		const h = fraction(mark.h);
		if (x === null || y === null || w === null || h === null) continue;
		// A box that starts on the page cannot run off it: the extent is cut at
		// the edge rather than the mark being dropped.
		const width = Math.min(w, 1 - x);
		const height = Math.min(h, 1 - y);
		if (width <= 0 || height <= 0) continue;

		marks.push({
			id: mark.id.slice(0, 64),
			kind,
			x,
			y,
			w: width,
			h: height,
		});
	}
	return marks;
}
