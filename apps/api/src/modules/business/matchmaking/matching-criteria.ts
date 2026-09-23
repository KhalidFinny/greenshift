// The five criteria a vendor pool is scored on, one function each.

import {
	EXPERIENCE_REFERENCE,
	MAX_RATING,
	PORTFOLIO_REFERENCE,
	proximityScore,
	VALUE_PORTFOLIO_SHARE,
} from "./scoring";

/** A word has to be at least this long to say anything about a project. */
const MIN_TOKEN_CHARS = 4;
/** Words every project or profile carries, which therefore say nothing. */
const STOPWORDS: Record<string, true> = {
	and: true,
	with: true,
	the: true,
	for: true,
	from: true,
	that: true,
	this: true,
	plant: true,
	project: true,
	projects: true,
	system: true,
	systems: true,
	service: true,
	services: true,
	company: true,
	indonesia: true,
	pt: true,
};

/** The measurable words of a text: lowercase, long enough, and not boilerplate. */
export function tokens(
	...texts: Array<string | null | undefined>
): Set<string> {
	const out = new Set<string>();
	for (const text of texts) {
		if (!text) continue;
		for (const word of text.toLowerCase().split(/[^a-z]+/)) {
			if (word.length >= MIN_TOKEN_CHARS && !STOPWORDS[word]) out.add(word);
		}
	}
	return out;
}

// A vendor with bid history scores on its sector share, one without on how much of the project's vocabulary it uses.
export function technicalFit(
	projectWords: Set<string>,
	vendorWords: Set<string>,
	sectorShare: number | null,
): number {
	if (sectorShare !== null) return clamp(sectorShare);
	if (projectWords.size === 0) return 50;
	let shared = 0;
	for (const word of projectWords) if (vendorWords.has(word)) shared += 1;
	return clamp((shared / projectWords.size) * 100);
}

/** Relevant experience: delivered projects against the reference, capped. */
export function relevantExperience(totalProjects: number | null): number {
	return clamp(((totalProjects ?? 0) / EXPERIENCE_REFERENCE) * 100);
}

/** Historical performance: the vendor's rating, out of five. */
export function historicalPerformance(rating: number | null): number {
	return clamp(((rating ?? 0) / MAX_RATING) * 100);
}

// Scored on the signals held before any quote: the vendor's own record and how close it works to the project.
export function priceValue(input: {
	rating: number | null;
	totalProjects: number | null;
	vendorLocation: string | null;
	projectLocation: string | null;
}): number {
	const record = clamp(
		((input.rating ?? 0) / MAX_RATING) * 50 +
			((input.totalProjects ?? 0) / PORTFOLIO_REFERENCE) * 50,
	);
	const proximity = proximityScore(input.vendorLocation, input.projectLocation);
	return clamp(
		record * VALUE_PORTFOLIO_SHARE + proximity * (1 - VALUE_PORTFOLIO_SHARE),
	);
}

// The stored assessment inverted, so a lower-risk project scores higher.
export function projectRisk(riskScore: number | null): number {
	return clamp(100 - (riskScore ?? 0));
}

function clamp(value: number): number {
	return Math.max(0, Math.min(100, value));
}
