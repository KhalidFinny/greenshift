// Credit score, mirroring the frontend's `credit-score.ts`: the parameters match it, not the wire contract.

// ADR-004.4: 0-100 from a debt-service proxy plus document completeness; a missing input yields null.
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

/** Rating bands per ADR-004.4. */
export function ratingForScore(score: number): string {
	if (score >= 85) return "AAA";
	if (score >= 75) return "AA";
	if (score >= 65) return "A";
	if (score >= 55) return "BBB+";
	if (score >= 45) return "BBB";
	if (score >= 35) return "BB";
	return "B";
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
	const score = Math.round(debtPoints * 0.7 + docPoints * 0.3);
	return { score, rating: ratingForScore(score) };
}
