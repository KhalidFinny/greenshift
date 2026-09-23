import type {
	BusinessMatchFactor,
	BusinessMatchmakingDetail,
	BusinessMatchmakingMethod,
	BusinessMatchmakingProject,
	BusinessRecommendedVendor,
	BusinessTender,
	BusinessTenderStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { projects, vendorMatchScores, vendors } from "../../../db/schema";
import { matchShortlistSize } from "../../../db/schema";
import { parseLimit } from "../../../lib/format";
import { pillStatus } from "../business.shared";
import * as procurement from "../procurement/procurement.service";
import * as projectsRepository from "../projects/projects.repository";
import * as repository from "./matchmaking.repository";
import { MATCH_CRITERIA, separatingCriteria } from "./scoring";

type ProjectRow = typeof projects.$inferSelect;
type ScoreRow = typeof vendorMatchScores.$inferSelect;
type VendorRow = typeof vendors.$inferSelect;

/** The three procurement routes, in the order the picker renders them. */
export const PROCUREMENT_METHODS: Array<{
	id: BusinessMatchmakingMethod;
	label: string;
	desc: string;
}> = [
	{
		id: "open",
		label: "Open Bidding",
		desc: "Every verified vendor can bid, and all of them see the bids as they come in.",
	},
	{
		id: "closed",
		label: "Closed Bidding",
		desc: "Only the recommended vendors are invited, and no bidder sees another's price.",
	},
	{
		id: "direct",
		label: "Direct Selection",
		desc: "One appointed vendor, privately, with no competing bids.",
	},
];

/** The stored score as a whole percentage, clamped to the model's 0–100. */
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

/** What the vendor does, read off its own profile: certifications, or volume. */
function subtitleFor(profile: VendorRow): string {
	const certifications = profile.certifications ?? [];
	if (certifications.length > 0) return certifications.slice(0, 2).join(" · ");
	return `${profile.totalProjects ?? 0} projects delivered`;
}

/**
 * Why a vendor ranks where it does. The criterion it stands out on is the one it
 * sits furthest above the pool on, not the one it scores highest on outright:
 * every vendor in a pool shares its strongest line, so only the gap separates
 * them. When it beats the pool nowhere, its own best line is the reason left.
 */
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

/**
 * How the scored vendor pool sits on each criterion: the mean across the ranked
 * rows, so the bars describe this project's market rather than one vendor's
 * strongest line, and the share each criterion actually carried in the score.
 */
function poolFactors(scored: ScoreRow[]): BusinessMatchFactor[] {
	if (scored.length === 0) return [];

	// The same rule the run applies, over the stored rows: a criterion the whole
	// pool scores the same on was left out of the total, so the weight shown here
	// is the one the score was actually built from.
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

function toRecommendedVendor(
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

function toProjectRow(
	project: ProjectRow,
	outcome: { status: BusinessTenderStatus; vendorName: string | null } | null,
): BusinessMatchmakingProject {
	return {
		id: project.id,
		name: project.title,
		location: project.location,
		sector: project.industrySector,
		submittedAt: project.submittedAt ? project.submittedAt.toISOString() : null,
		capexRp: project.capexRp,
		status: pillStatus(project.status),
		awardedVendor: outcome?.vendorName ?? null,
		tenderStatus: outcome?.status ?? null,
	};
}

export type DetailResult =
	| { outcome: "ok"; detail: BusinessMatchmakingDetail }
	| { outcome: "not_found" };

export type SelectionResult =
	| {
			outcome: "ok";
			vendorId: number | null;
			vendorName: string | null;
			method: BusinessMatchmakingMethod;
			tender: BusinessTender;
	  }
	| { outcome: "not_found" }
	| { outcome: "unknown_method" }
	| { outcome: "unknown_vendor" }
	| { outcome: "vendor_required" }
	| { outcome: "deadline_invalid" }
	| { outcome: "tender_locked"; status: string };

/** The company's projects, each with the vendor it has already chosen. */
export async function listMatchmaking(
	db: GreenShiftDb,
	companyId: number,
	limitRaw: string | undefined,
): Promise<BusinessMatchmakingProject[]> {
	const [rows, outcomes] = await Promise.all([
		projectsRepository.listCompanyProjects(db, companyId, parseLimit(limitRaw)),
		repository.listTenderOutcomes(db, companyId),
	]);

	return rows.map((row) => toProjectRow(row, outcomes.get(row.id) ?? null));
}

/** Everything the detail screen renders for one project. */
export async function readMatchmakingDetail(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<DetailResult> {
	const project = await projectsRepository.findCompanyProject(
		db,
		projectId,
		companyId,
	);
	if (!project) return { outcome: "not_found" };

	const [scored, assignment, tender] = await Promise.all([
		repository.listScoredVendors(db, projectId),
		repository.findAssignment(db, projectId, companyId),
		procurement.readTender(db, companyId, projectId),
	]);

	// The pool's means are read once: each vendor's row is described against the
	// pool it is ranked in, and the panel describes that same pool.
	const factors = poolFactors(scored.map((row) => row.score));
	const poolMeans = new Map(
		factors.map((factor) => [factor.label, factor.pct]),
	);

	return {
		outcome: "ok",
		detail: {
			project: toProjectRow(project, {
				status: (tender?.tender.status ?? "open") as BusinessTenderStatus,
				vendorName: tender?.tender.awardedVendorName ?? null,
			}),
			// The whole pool, not only the shortlist: the company reads the ranking
			// before it appoints, and picks between the shortlisted few from it.
			recommendedVendors: scored.map((row) =>
				toRecommendedVendor(row.score, row.profile, poolMeans),
			),
			// The factors describe the whole pool, not the shortlist: they are a
			// reading of this project's market rather than of the three offered.
			matchFactors: factors,
			poolSize: scored.length,
			shortlistSize: matchShortlistSize,
			procurementMethods: PROCUREMENT_METHODS,
			selectedMethod: assignment?.method ?? null,
			selectedVendorId: assignment?.vendorId ?? null,
			tender: tender?.tender ?? null,
			bids: tender?.bids ?? [],
		},
	};
}

/**
 * Records the company's choice and opens the tender it implies. Choosing the
 * route is what starts procurement: from here the project is in its tendering
 * phase, the deadline is running, and the invited vendors can bid.
 */
export async function saveSelection(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	body: {
		vendorId?: unknown;
		method?: unknown;
		deadlineAt?: unknown;
		budgetMin?: unknown;
		budgetMax?: unknown;
	},
): Promise<SelectionResult> {
	const project = await projectsRepository.findCompanyProject(
		db,
		projectId,
		companyId,
	);
	if (!project) return { outcome: "not_found" };

	const method = PROCUREMENT_METHODS.find((m) => m.id === body.method);
	if (!method) return { outcome: "unknown_method" };

	// The direct route is the one that appoints a single vendor up front, so it is
	// the only route that has to name one before the tender opens. The open and
	// closed routes invite their own pool, and the vendor a project ends up with
	// is whichever bid the company awards on the bidding page.
	const rawVendorId = Number(body.vendorId);
	const namedVendorId =
		Number.isInteger(rawVendorId) && rawVendorId > 0 ? rawVendorId : null;
	if (method.id === "direct" && namedVendorId === null) {
		return { outcome: "vendor_required" };
	}

	const vendor =
		namedVendorId === null
			? null
			: await repository.findScoredVendor(db, projectId, namedVendorId);
	if (namedVendorId !== null && !vendor) return { outcome: "unknown_vendor" };

	const deadlineAt = new Date(String(body.deadlineAt ?? ""));
	if (Number.isNaN(deadlineAt.getTime())) {
		return { outcome: "deadline_invalid" };
	}

	// The tender opens first: a deadline the server refuses must not leave an
	// appointment recorded against a project that never started bidding.
	const opened = await procurement.openTender(db, companyId, projectId, {
		method: method.id,
		deadlineAt,
		budgetMin: numberOrNull(body.budgetMin),
		budgetMax: numberOrNull(body.budgetMax),
	});
	if (opened.outcome === "deadline_invalid") {
		return { outcome: "deadline_invalid" };
	}
	if (opened.outcome === "tender_locked") {
		return { outcome: "tender_locked", status: opened.status };
	}

	if (vendor) {
		await repository.upsertAssignment(db, {
			projectId,
			vendorId: vendor.vendorId,
			vendorName: vendor.vendorName,
			method: method.id,
		});
	}

	return {
		outcome: "ok",
		vendorId: vendor?.vendorId ?? null,
		vendorName: vendor?.vendorName ?? null,
		method: method.id,
		tender: procurement.toTender(opened.tender, {
			bidCount: 0,
			awardedVendorName: null,
		}),
	};
}

/** A budget bound as the API reads it: absent, or a finite number. */
function numberOrNull(value: unknown): number | null {
	const parsed = Number(value);
	return value === null ||
		value === undefined ||
		value === "" ||
		!Number.isFinite(parsed)
		? null
		: parsed;
}
