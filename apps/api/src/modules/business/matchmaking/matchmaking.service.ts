// The matchmaking screen's reads: the company's projects, and one project's ranking with its tender.

import type {
	BusinessMatchmakingDetail,
	BusinessMatchmakingProject,
	BusinessTenderStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { projects } from "../../../db/schema";
import { matchShortlistSize } from "../../../db/schema";
import { parseLimit } from "../../../lib/format";
import { pillStatus } from "../business.shared";
import * as procurement from "../procurement/procurement.service";
import * as projectsRepository from "../projects/projects.repository";
import * as repository from "./matchmaking.repository";
import { poolFactors, toRecommendedVendor } from "./matchmaking-ranking";
import { PROCUREMENT_METHODS } from "./matchmaking-selection.service";

export type { SelectionResult } from "./matchmaking-selection.service";
export { saveSelection } from "./matchmaking-selection.service";

type ProjectRow = typeof projects.$inferSelect;

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

	// The pool's means are read once: each vendor's row is described against the pool it is ranked in.
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
			// The whole pool, not only the shortlist: the company reads the ranking before it appoints.
			recommendedVendors: scored.map((row) =>
				toRecommendedVendor(row.score, row.profile, poolMeans),
			),
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
