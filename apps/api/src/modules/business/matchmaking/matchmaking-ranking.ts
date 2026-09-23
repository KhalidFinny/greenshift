// The ranking a project's pool is read as: the pool's means, and the reasons each vendor's row gives.

import type {
	BusinessMatchFactor,
	BusinessRecommendedVendor,
} from "../../../contracts";
import type { vendorMatchScores, vendors } from "../../../db/schema";
import { matchShortlistSize } from "../../../db/schema";
import { MATCH_CRITERIA, separatingCriteria } from "./scoring";

type ScoreRow = typeof vendorMatchScores.$inferSelect;
type VendorRow = typeof vendors.$inferSelect;

/** The stored score as a whole percentage, clamped to the model's 0-100. */
function pct(value: number | null): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return 0;
	return Math.round(Math.min(Math.max(value, 0), 100));
}

/** One vendor's own readings, for the reasons its row gives. Not the pool's. */
interface VendorCriterionReading {
	label: string;
	pct: number;
}

function criteriaFor(score: ScoreRow): VendorCriterionReading[] {
	return MATCH_CRITERIA.map((criterion) => ({
		label: criterion.label,
		pct: pct(score[criterion.key]),
	}));
}

function subtitleFor(profile: VendorRow): string {
	const certifications = profile.certifications ?? [];
	if (certifications.length > 0) return certifications.slice(0, 2).join(" · ");
	return `${profile.totalProjects ?? 0} projects delivered`;
}

// The standout is the criterion it beats the pool on, not its highest outright: every vendor shares its strongest line.
function whyRank(
	criteria: VendorCriterionReading[],
	profile: VendorRow,
	poolMeans: Map<string, number>,
): string[] {
	const [lead] = [...criteria].sort(
		(a, b) =>
			b.pct -
			(poolMeans.get(b.label) ?? b.pct) -
			(a.pct - (poolMeans.get(a.label) ?? a.pct)),
	);
	const pool = lead ? poolMeans.get(lead.label) : undefined;
	const reasons =
		lead && pool !== undefined && lead.pct > pool
			? [`Leads on ${lead.label.toLowerCase()} · ${lead.pct}% vs ${pool}% pool`]
			: lead
				? [`Best on ${lead.label.toLowerCase()} · ${lead.pct}%`]
				: [];

	if (profile.totalProjects) {
		reasons.push(
			`${profile.totalProjects} projects delivered, rated ${(profile.rating ?? 0).toFixed(1)}`,
		);
	}

	return reasons;
}

// The pool's mean per criterion, so the bars describe this project's market.
export function poolFactors(scored: ScoreRow[]): BusinessMatchFactor[] {
	if (scored.length === 0) return [];

	// The weight shown is the one the score was built from, under the run's own separating-criteria rule.
	const applied = separatingCriteria(
		scored.map((row) => ({
			technicalFit: pct(row.technicalFit),
			relevantExperience: pct(row.relevantExperience),
			historicalPerformance: pct(row.historicalPerformance),
			priceValue: pct(row.priceValue),
			projectRisk: pct(row.projectRisk),
		})),
	);
	const appliedWeight = MATCH_CRITERIA.filter((criterion) =>
		applied.includes(criterion.key),
	).reduce((sum, criterion) => sum + criterion.weight, 0);

	return MATCH_CRITERIA.map((criterion) => {
		const isApplied = applied.includes(criterion.key);
		return {
			label: criterion.label,
			pct: Math.round(
				scored.reduce((total, row) => total + pct(row[criterion.key]), 0) /
					scored.length,
			),
			weight:
				isApplied && appliedWeight > 0
					? Math.round((criterion.weight / appliedWeight) * 100)
					: 0,
			applied: isApplied,
		};
	}).sort((a, b) => b.weight - a.weight || b.pct - a.pct);
}

export function toRecommendedVendor(
	score: ScoreRow,
	profile: VendorRow,
	poolMeans: Map<string, number>,
): BusinessRecommendedVendor {
	const criteria = criteriaFor(score);
	return {
		id: profile.id,
		name: profile.companyName,
		subtitle: subtitleFor(profile),
		score: pct(score.totalScore),
		rank: score.rank ?? 0,
		rating: profile.rating ?? 0,
		totalProjects: profile.totalProjects ?? 0,
		verified: profile.verifiedAt !== null,
		shortlisted:
			(score.rank ?? 0) > 0 && (score.rank ?? 0) <= matchShortlistSize,
		criteria,
		whyRank: whyRank(criteria, profile, poolMeans),
	};
}
