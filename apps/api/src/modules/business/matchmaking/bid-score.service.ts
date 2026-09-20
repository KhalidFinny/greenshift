/* Scoring the offers on a tender from the proposals themselves.
 *
 * This is a different question from the vendor matching run: matching asks which
 * vendors are worth inviting, before anyone has quoted, and reads their records.
 * This asks which of the offers in front of the company is the better one, and
 * can only read what the vendors proposed.
 *
 * Every criterion is scored across the bids on this tender, so the best offer on
 * each one takes 100 and the worst takes 0. That keeps the scoring fair without
 * a house price band: a tender where every vendor is expensive still separates
 * the cheapest of them.
 */

import type { BusinessProcurementBid } from "../../../contracts";

/** What a bid is scored on, and how much each part is worth. */
export const BID_CRITERIA = [
	{ key: "amount", label: "Price", weight: 35 },
	{ key: "operationalCost", label: "Operating cost", weight: 20 },
	{ key: "projectedRoi", label: "Projected ROI", weight: 20 },
	{ key: "warrantyPeriod", label: "Warranty", weight: 15 },
	{ key: "scope", label: "Scope stated", weight: 10 },
] as const;

export type BidCriterionKey = (typeof BID_CRITERIA)[number]["key"];

export interface ScoredBid {
	bid: BusinessProcurementBid;
	/** 0-100 across the bids on this tender, or null when there is only one. */
	score: number | null;
	criteria: Array<{ label: string; pct: number | null; weight: number }>;
}

/**
 * A value scored across the bids: the best takes 100 and the worst 0, linear in
 * between. `higherIsBetter` flips it for costs. A field no bid states is null
 * rather than zero, so an unstated figure is missing, not the worst.
 */
function acrossBids(
	values: Array<number | null>,
	higherIsBetter: boolean,
): Array<number | null> {
	const known = values.flatMap((value) => (value === null ? [] : [value]));
	if (known.length === 0) return values.map(() => null);

	const best = higherIsBetter ? Math.max(...known) : Math.min(...known);
	const worst = higherIsBetter ? Math.min(...known) : Math.max(...known);
	if (best === worst)
		return values.map((value) => (value === null ? null : 100));

	return values.map((value) => {
		if (value === null) return null;
		const share = (value - worst) / (best - worst);
		return Math.round(share * 100);
	});
}

/**
 * Scores the offers on one tender. With a single bid there is nothing to compare
 * against, so the score is null and the screen says so rather than implying a
 * ranking of one.
 */
export function scoreBids(bids: BusinessProcurementBid[]): ScoredBid[] {
	const amounts = acrossBids(
		bids.map((bid) => bid.amount),
		false,
	);
	const operating = acrossBids(
		bids.map((bid) => bid.operationalCost),
		false,
	);
	const roi = acrossBids(
		bids.map((bid) => bid.projectedRoi),
		true,
	);
	const warranty = acrossBids(
		bids.map((bid) => bid.warrantyPeriod),
		true,
	);
	// A scope is either on the bid or it is not, so it is a yes rather than a
	// measurement: an absent specification is the only zero here.
	const scope = bids.map((bid) =>
		bid.technicalSpec && bid.technicalSpec.trim().length > 0 ? 100 : 0,
	);

	return bids.map((bid, index) => {
		const criteria = [
			{ key: "amount", pct: amounts[index] },
			{ key: "operationalCost", pct: operating[index] },
			{ key: "projectedRoi", pct: roi[index] },
			{ key: "warrantyPeriod", pct: warranty[index] },
			{ key: "scope", pct: scope[index] },
		] as Array<{ key: BidCriterionKey; pct: number | null }>;

		const stated = criteria.filter((row) => row.pct !== null);
		const weight = stated.reduce(
			(sum, row) =>
				sum +
				(BID_CRITERIA.find((criterion) => criterion.key === row.key)?.weight ??
					0),
			0,
		);
		const score =
			bids.length < 2 || weight === 0
				? null
				: Math.round(
						stated.reduce((sum, row) => {
							const criterion = BID_CRITERIA.find((c) => c.key === row.key);
							return sum + (row.pct ?? 0) * (criterion?.weight ?? 0);
						}, 0) / weight,
					);

		return {
			bid,
			score,
			criteria: criteria.map((row) => ({
				label:
					BID_CRITERIA.find((criterion) => criterion.key === row.key)?.label ??
					row.key,
				pct: row.pct,
				weight:
					BID_CRITERIA.find((criterion) => criterion.key === row.key)?.weight ??
					0,
			})),
		};
	});
}
