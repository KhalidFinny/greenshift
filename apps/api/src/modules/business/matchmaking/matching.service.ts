/* The matching run: after verification, score the vendor pool for a project and
 * write the ranked rows the matchmaking screen reads. Model tables live in scoring.ts. */

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

// A vendor with bid history is scored on its sector share; one without, on how much
// of the project's vocabulary it uses. With neither to measure, neutral, not zero.
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

// Price & value scores the signals held before any quote: the vendor's own record
// (rating, delivered volume) and how close it works to the project. All linear.
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

// The stored assessment, inverted so a lower-risk project scores higher. Same for
// every vendor.
function projectRisk(riskScore: number | null): number {
	return clamp(100 - (riskScore ?? 0));
}

function clamp(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export interface MatchingResult {
	scored: number;
	/** Their ranks, best first; the shortlist is the first matchShortlistSize. */
	shortlist: Array<{ vendorId: number; name: string; score: number }>;
}

// Scores the project's verified pool (an unverified profile cannot bid) and stores
// the ranking. Re-running replaces the project's rows, never stacking two rankings.
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

	/* The project's own vocabulary: what it is and what it asks a bidder to meet.
	   The technical requirements are the company's statement of the work. */
	const projectWords = tokens(
		project.industrySector,
		project.title,
		project.description,
		project.technicalRequirements?.join(" "),
	);
	const risk = projectRisk(project.riskScore);

	// The sector record decides technical fit only while it separates the pool: with
	// no bid in this sector it says nothing, and the profile text is better evidence.
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

	/* A criterion the whole pool ties on cannot separate vendors, so it is dropped and
	   the rest renormalised; otherwise an evidence-less criterion drags every score down. */
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
