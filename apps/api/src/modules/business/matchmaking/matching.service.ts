// The matching run: score the verified vendor pool for a project and write the ranked rows the screen reads.

import type { GreenShiftDb } from "../../../db";
import { matchShortlistSize } from "../../../db/schema";
import * as repository from "./matching.repository";
import {
	historicalPerformance,
	priceValue,
	projectRisk,
	relevantExperience,
	technicalFit,
	tokens,
} from "./matching-criteria";
import { MATCH_CRITERIA, MATCH_WEIGHTS, separatingCriteria } from "./scoring";

export interface MatchingResult {
	scored: number;
	/** Their ranks, best first; the shortlist is the first matchShortlistSize. */
	shortlist: Array<{ vendorId: number; name: string; score: number }>;
}

// An unverified profile cannot bid, and a re-run replaces the project's rows rather than stacking a second ranking.
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

	// The project's own vocabulary: what it is and what it asks a bidder to meet.
	const projectWords = tokens(
		project.industrySector,
		project.title,
		project.description,
		project.technicalRequirements?.join(" "),
	);
	const risk = projectRisk(project.riskScore);

	// The sector record decides technical fit only while it separates the pool; otherwise the profile text is better evidence.
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

	// A criterion the whole pool ties on cannot separate vendors, so it is dropped and the rest renormalised.
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
