import type { PortfolioItem } from "@greenshift/api/contracts";
import { monthLabel, titleCase } from "./format";

export interface PortfolioTotals {
	invested: number;
	roiPaid: number;
	activeBonds: number;
	projects: number;
	sectors: number;
	irrAverage: number | null;
	targetReduction: number | null;
	energySaving: number | null;
}

// Type alias (not interface) so the objects carry the implicit index
// signature BarChart expects from its data prop.
export type MonthBucket = {
	key: string;
	label: string;
	value: number;
};

export interface SectorSlice {
	sector: string;
	amount: number;
	share: number; // 0..1
}

const sectorOf = (item: PortfolioItem): string =>
	titleCase(item.project.industrySector?.trim() || "Umum");

export function portfolioTotals(items: PortfolioItem[]): PortfolioTotals {
	const invested = items.reduce((sum, item) => sum + item.investment.amount, 0);
	const roiPaid = items.reduce((sum, item) => sum + item.investment.roiPaid, 0);
	const activeBonds = items.filter(
		(item) => item.investment.status === "active",
	).length;
	const projects = new Set(items.map((item) => item.project.id)).size;
	const sectors = new Set(items.map(sectorOf)).size;
	const irrs = items
		.map((item) => item.blueprint.irr)
		.filter((value): value is number => typeof value === "number");
	const irrAverage =
		irrs.length > 0
			? irrs.reduce((sum, value) => sum + value, 0) / irrs.length
			: null;
	const targetReduction = items.reduce(
		(sum, item) => sum + (item.project.targetEmissionReduction ?? 0),
		0,
	);
	const energySaving = items.reduce(
		(sum, item) => sum + (item.project.estimatedEnergySaving ?? 0),
		0,
	);
	return {
		invested,
		roiPaid,
		activeBonds,
		projects,
		sectors,
		irrAverage,
		targetReduction: targetReduction > 0 ? targetReduction : null,
		energySaving: energySaving > 0 ? energySaving : null,
	};
}

/** Invested amount per calendar month (YYYY-MM), newest first, capped. */
export function investedByMonth(
	items: PortfolioItem[],
	maxMonths = 8,
): MonthBucket[] {
	const buckets = new Map<string, number>();
	for (const item of items) {
		if (!item.investment.investedAt) continue;
		const date = new Date(item.investment.investedAt);
		if (Number.isNaN(date.getTime())) continue;
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		buckets.set(key, (buckets.get(key) ?? 0) + item.investment.amount);
	}
	if (buckets.size === 0) return [];
	const keys = [...buckets.keys()].sort();
	const start = new Date(`${keys[0]}-01T00:00:00`);
	const now = new Date();
	const first = new Date(start.getFullYear(), start.getMonth(), 1);
	const last = new Date(now.getFullYear(), now.getMonth(), 1);
	const months: MonthBucket[] = [];
	for (
		let cursor = first;
		cursor <= last;
		cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
	) {
		const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
		if (months.length >= maxMonths) break;
		months.push({ key, label: monthLabel(key), value: buckets.get(key) ?? 0 });
	}
	return months;
}

/** Sector allocation of the invested principal, largest share first. */
export function investedBySector(items: PortfolioItem[]): SectorSlice[] {
	const totals = new Map<string, number>();
	for (const item of items) {
		const sector = sectorOf(item);
		totals.set(sector, (totals.get(sector) ?? 0) + item.investment.amount);
	}
	const invested = [...totals.values()].reduce((a, b) => a + b, 0);
	if (invested <= 0) return [];
	return [...totals.entries()]
		.map(([sector, amount]) => ({ sector, amount, share: amount / invested }))
		.sort((a, b) => b.amount - a.amount);
}
