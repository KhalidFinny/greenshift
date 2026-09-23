/* ADR-004.4: the credit score is derived, not stored. Score 0-100 from a debt-service proxy
 * (annual saving / (CAPEX / tenor), capped) plus document completeness; empty input -> null. */
export interface CreditScoreInput {
	capex: number | null;
	tenor: number | null;
	saving: number | null;
	docsDone: number;
	docsTotal: number;
}

export interface CreditScoreResult {
	score: number | null;
	rating: string | null;
}

/** Each half's weight; the wizard panel draws the score as these two parts. */
export const SCORE_WEIGHTS = { funding: 70, documents: 30 } as const;

/** The two files the document share is measured against; submit only needs one. */
export const STEP2_DOC_TARGET = 2;

/** Rating bands low to high; `min` is the first score in the band. */
const RATING_BANDS = [
	{ rating: "B", min: 0 },
	{ rating: "BB", min: 35 },
	{ rating: "BBB", min: 45 },
	{ rating: "BBB+", min: 55 },
	{ rating: "A", min: 65 },
	{ rating: "AA", min: 75 },
	{ rating: "AAA", min: 85 },
] as const;

function ratingBandIndex(score: number): number {
	let index = 0;
	for (const [i, band] of RATING_BANDS.entries()) {
		if (score >= band.min) index = i;
	}
	return index;
}

export function ratingForScore(score: number): string {
	return RATING_BANDS[ratingBandIndex(score)].rating;
}

/** The next band up, or null when the score is already in the top band. */
export function nextRatingBand(
	score: number,
): { rating: string; min: number } | null {
	const next = RATING_BANDS[ratingBandIndex(score) + 1];
	return next ? { rating: next.rating, min: next.min } : null;
}

export function creditScore(input: CreditScoreInput): CreditScoreResult {
	const { capex, tenor, saving, docsDone, docsTotal } = input;
	if (capex === null || tenor === null || tenor <= 0 || saving === null) {
		return { score: null, rating: null };
	}
	const annualDebt = capex / tenor;
	if (!(annualDebt > 0)) return { score: null, rating: null };
	const debtPoints = Math.min(100, Math.max(0, (saving / annualDebt) * 100));
	const docPoints =
		docsTotal > 0
			? Math.min(100, Math.max(0, (docsDone / docsTotal) * 100))
			: 0;
	const score = Math.round(
		debtPoints * (SCORE_WEIGHTS.funding / 100) +
			docPoints * (SCORE_WEIGHTS.documents / 100),
	);
	return { score, rating: ratingForScore(score) };
}
