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

// Recomputes the assessment from the stored inputs, so a changed project is never
// described by a stale score; no wizard inputs means no assessment, not an invented one.
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

// Writes the reading for a project that has none, out of band so a read never waits on
// the model. Runs at most once: a row with any reading, even a composed one, is left alone.
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
