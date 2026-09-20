import type {
	BusinessRisk,
	BusinessRiskInsight,
	BusinessRiskInsightBody,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import {
	finansialTone,
	implementasiTone,
	projectRisk,
	teknisTone,
} from "../business.scoring";
import { CHECKLIST_SLOTS } from "../business.shared";
import * as documentsRepository from "../documents/documents.repository";
import * as repository from "../projects/projects.repository";
import { composeInsight, eleanorInsight } from "./eleanor.service";

export type RiskResult =
	| {
			outcome: "ok";
			risk: BusinessRisk;
			/** True when the row has no written reading yet. */
			needsInsight: boolean;
	  }
	| { outcome: "not_found" };

/**
 * Recomputes the assessment from the stored inputs instead of serving the
 * number written at submit, so a project whose inputs changed is never
 * described by a stale score.
 *
 * The written reading is not recomputed. It is read from the row when it is
 * there, and composed from figures the model already produced when it is not,
 * so this call never waits on a model. `needsInsight` says whether the row still
 * has to be filled, which the caller does out of band.
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

	const stored = await repository.findRiskInsight(db, projectId);
	const insight: BusinessRiskInsight = stored?.insight
		? { text: stored.insight, source: stored.source === "ai" ? "ai" : "model" }
		: { text: composeInsight(risk), source: "model" };

	return {
		outcome: "ok",
		risk: { ...risk, insight },
		needsInsight: !stored?.insight,
	};
}

/**
 * Writes the reading for a project that has none. Called out of band, so a read
 * never waits on the model and the row is filled by the time anyone looks again.
 * It runs at most once per project: a row that has any reading is left alone,
 * even one the analyst composed because the model was unavailable.
 */
export async function writeProjectInsight(
	env: Env,
	db: GreenShiftDb,
	projectId: number,
	risk: BusinessRiskInsightBody,
): Promise<void> {
	const insight = await eleanorInsight(env, risk);
	await repository.writeRiskInsight(
		db,
		projectId,
		insight.text,
		insight.source,
	);
}
