/* The matching run: after verification, score the vendor pool for a project and
 * write the ranked rows the matchmaking screen reads.
 *
 * Every criterion is derived from fields the platform already holds, and each
 * derivation is stated beside it. The model's own tables, the five criterion
 * weights and the provinces the location term reads, live in `scoring.ts`, so
 * the seed that has to produce a reproducible ranking reads them too.
 *
 * Project risk is a property of the project rather than of the vendor, so it
 * moves every vendor's total the same way and the read renormalises it away. That
 * is the seam a vendor-level risk model would fill.
 */

import type { GreenShiftDb } from "../../../db";
import { matchShortlistSize } from "../../../db/schema";
import * as repository from "./matching.repository";
import {
	EXPERIENCE_REFERENCE,
	MATCH_CRITERIA,
	MATCH_WEIGHTS,
	MAX_RATING,
	PORTFOLIO_REFERENCE,
	proximityScore,
	separatingCriteria,
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
function tokens(...texts: Array<string | null | undefined>): Set<string> {
	const out = new Set<string>();
	for (const text of texts) {
		if (!text) continue;
		for (const word of text.toLowerCase().split(/[^a-z]+/)) {
			if (word.length >= MIN_TOKEN_CHARS && !STOPWORDS[word]) out.add(word);
		}
	}
	return out;
}

/**
 * Technical fit, in two branches, because the platform holds two kinds of
 * evidence: a vendor that has bid before is scored on that record, the share of
 * its bids made on projects in this project's sector; a vendor with no history is
 * scored on how much of this project's own vocabulary its certifications,
 * portfolio and description already use. Neither the sector nor any words to
 * compare leaves nothing to measure, which reads as neutral rather than zero.
 */
function technicalFit(
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
function relevantExperience(totalProjects: number | null): number {
	return clamp(((totalProjects ?? 0) / EXPERIENCE_REFERENCE) * 100);
}

/** Historical performance: the vendor's rating, out of five. */
function historicalPerformance(rating: number | null): number {
	return clamp(((rating ?? 0) / MAX_RATING) * 100);
}

/**
 * Price & value. What a vendor is worth is not only its price: the platform
 * scores the value signals it holds before anyone has quoted, which are the
 * vendor's own record (its rating and the volume it has delivered) and how close
 * it works to the project (distance is freight, travel and response time).
 *
 * All three are linear: rating and delivered volume are straight proportions,
 * and proximity is the province term in `scoring.ts`. No bids are needed, so the
 * criterion is available to every vendor from the first run.
 */
function priceValue(input: {
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

/**
 * Project risk: the assessment the platform already stored, inverted so that a
 * lower-risk project scores higher. Same for every vendor.
 */
function projectRisk(riskScore: number | null): number {
	return clamp(100 - (riskScore ?? 0));
}

function clamp(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export interface MatchingResult {
	/** How many verified vendors were scored. */
	scored: number;
	/** Their ranks, best first; the shortlist is the first matchShortlistSize. */
	shortlist: Array<{ vendorId: number; name: string; score: number }>;
}

/**
 * Scores the project's vendor pool and stores the ranking. The pool is the
 * verified vendors: an unverified profile cannot bid, so ranking it would offer
 * the company a vendor that is not actually available.
 *
 * Re-running replaces the project's rows, so a second pass over the same project
 * cannot leave two rankings behind.
 */
export async function runMatching(
	db: GreenShiftDb,
	projectId: number,
): Promise<MatchingResult | null> {
	const project = await repository.findProjectForMatching(db, projectId);
	if (!project) return null;

	const [pool, sectorHistory] = await Promise.all([
		repository.listVerifiedVendors(db),
		project.industrySector
			? repository.sectorShareByVendor(db, project.industrySector)
			: Promise.resolve(new Map<number, number>()),
	]);
	if (pool.length === 0) {
		await repository.replaceProjectScores(db, projectId, []);
		return { scored: 0, shortlist: [] };
	}

	/* The project's own vocabulary: what it is, and what it asks a bidder to
	   meet. The key technical requirements are the company's statement of the
	   work, so they are part of what the fit is measured against. */
	const projectWords = tokens(
		project.industrySector,
		project.title,
		project.description,
		project.technicalRequirements?.join(" "),
	);
	const risk = projectRisk(project.riskScore);

	// The sector record decides technical fit only while it separates the pool:
	// when no vendor has ever bid in this sector it says nothing about any of
	// them, and the profile text is the better evidence.
	const sectorShares = pool.map(
		(vendor) => sectorHistory.get(vendor.id) ?? null,
	);
	const sectorSeparates = sectorShares.some(
		(share) => share !== null && share > 0,
	);

	const scored = pool
		.map((vendor) => {
			const vendorWords = tokens(
				vendor.certifications?.join(" "),
				vendor.portfolio?.join(" "),
				vendor.description,
				vendor.serviceCategory,
			);
			const criteria = {
				technicalFit: technicalFit(
					projectWords,
					vendorWords,
					sectorSeparates ? (sectorHistory.get(vendor.id) ?? null) : null,
				),
				relevantExperience: relevantExperience(vendor.totalProjects),
				historicalPerformance: historicalPerformance(vendor.rating),
				priceValue: priceValue({
					rating: vendor.rating,
					totalProjects: vendor.totalProjects,
					vendorLocation: vendor.location,
					projectLocation: project.location,
				}),
				projectRisk: risk,
			};
			return {
				vendorId: vendor.id,
				name: vendor.companyName,
				criteria,
			};
		})
		.sort((a, b) => a.vendorId - b.vendorId);

	/*
	 * A criterion the whole pool scores the same on cannot separate the vendors,
	 * so it is left out of the total and the remaining weights are renormalised
	 * over it. Without this, a criterion with no evidence behind it (price value
	 * before anyone has bid, technical fit before anyone has bid in this sector)
	 * would drag every score down by its own weight without telling the company
	 * anything about the difference between the vendors.
	 */
	const separating = separatingCriteria(scored.map((row) => row.criteria));

	const weightTotal = separating.reduce(
		(sum, key) => sum + MATCH_WEIGHTS[key],
		0,
	);

	const ranked = scored
		.map((row) => {
			const total =
				weightTotal === 0
					? MATCH_CRITERIA.reduce(
							(sum, criterion) =>
								sum + row.criteria[criterion.key] * criterion.weight,
							0,
						) / 100
					: separating.reduce(
							(sum, key) => sum + row.criteria[key] * MATCH_WEIGHTS[key],
							0,
						) / weightTotal;
			return { ...row, total: Math.round(total) };
		})
		.sort((a, b) => b.total - a.total || a.vendorId - b.vendorId);

	await repository.replaceProjectScores(
		db,
		projectId,
		ranked.map((row, index) => ({
			vendorId: row.vendorId,
			criteria: row.criteria,
			total: row.total,
			rank: index + 1,
		})),
	);

	return {
		scored: ranked.length,
		shortlist: ranked.slice(0, matchShortlistSize).map((row) => ({
			vendorId: row.vendorId,
			name: row.name,
			score: row.total,
		})),
	};
}
