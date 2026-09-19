import type { BusinessRisk } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	finansialTone,
	implementasiTone,
	projectRisk,
	teknisTone,
} from "../business.scoring";
import { CHECKLIST_SLOTS } from "../business.shared";
import * as documentsRepository from "../documents/documents.repository";
import * as repository from "../projects/projects.repository";

export type RiskResult =
	| { outcome: "ok"; risk: BusinessRisk }
	| { outcome: "not_found" };

/**
 * Recomputes the assessment from the stored inputs instead of serving the
 * number written at submit, so a project whose inputs changed is never
 * described by a stale score.
 *
 * A project with no wizard inputs at all (one seeded or created elsewhere) has
 * no assessment from this model, and says so rather than inventing one.
 */
export async function readProjectRisk(
	db: GreenShiftDb,
	projectId: number,
	companyId: number,
): Promise<RiskResult> {
	const project = await repository.findCompanyProject(db, projectId, companyId);
	if (!project) return { outcome: "not_found" };

	const documents = await documentsRepository.listProjectDocuments(
		db,
		projectId,
	);
	const slots = documents.map((document) => document.type);
	const done = CHECKLIST_SLOTS.filter((slot) => slots.includes(slot)).length;

	const risk = projectRisk({
		finansial: finansialTone(project.biayaRp),
		teknis: teknisTone(project.konsumsiMwh),
		implementasi: implementasiTone(project.timelineQuarter),
		creditScore: project.creditScore,
		docsDone: done,
		docsTotal: CHECKLIST_SLOTS.length,
	});
	if (!risk) return { outcome: "not_found" };

	return { outcome: "ok", risk };
}
