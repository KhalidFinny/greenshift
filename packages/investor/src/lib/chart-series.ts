import { quarterKey, quarterLabel } from "./format";

/** Type alias — implicit index signature so BarChart accepts the rows. */
export type ReductionQuarter = {
	label: string;
	value: number;
};

/** Aggregated emission reduction per calendar quarter, oldest first. */
export function reductionsByQuarter(
	reports: Array<{ periodEnd: string | null; emissionReduction: number | null }>,
): ReductionQuarter[] {
	const totals = new Map<string, number>();
	for (const report of reports) {
		if (!report.periodEnd || typeof report.emissionReduction !== "number") {
			continue;
		}
		const date = new Date(report.periodEnd);
		if (Number.isNaN(date.getTime())) continue;
		const key = quarterKey(date);
		totals.set(key, (totals.get(key) ?? 0) + report.emissionReduction);
	}
	return [...totals.keys()]
		.sort()
		.map((key) => ({ label: quarterLabel(key), value: totals.get(key) ?? 0 }));
}

/** Type alias — implicit index signature so BarChart accepts the rows. */
export type MoneyQuarter = {
	label: string;
	paid: number;
	scheduled: number;
};

/** Paid vs scheduled ROI amounts per period ("YYYY-Qn"), oldest first. */
export function roiFlowByQuarter(
	payments: Array<{
		period: string | null;
		status: string;
		amount: number;
	}>,
): MoneyQuarter[] {
	const buckets = new Map<
		string,
		{ label: string; paid: number; scheduled: number }
	>();
	for (const payment of payments) {
		if (!payment.period) continue;
		const bucket = buckets.get(payment.period) ?? {
			label: quarterLabel(payment.period),
			paid: 0,
			scheduled: 0,
		};
		if (payment.status === "paid") bucket.paid += payment.amount;
		else if (payment.status === "scheduled") bucket.scheduled += payment.amount;
		buckets.set(payment.period, bucket);
	}
	return [...buckets.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, bucket]) => bucket);
}
