import type {
	BusinessProjectSummary,
	BusinessSubmitBody,
	BusinessSubmittedProject,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	creditScore,
	finansialTone,
	implementasiTone,
	projectRisk,
	teknisTone,
} from "../business.scoring";
import { CHECKLIST_SLOTS, pillStatus } from "../business.shared";
import {
	CONSENT_MESSAGE,
	type FieldErrors,
	step1Errors,
	step2Errors,
	validationSummary,
} from "../business.validation";
import * as documentsRepository from "../documents/documents.repository";
import * as draftsRepository from "../drafts/drafts.repository";
import * as repository from "./projects.repository";

export type SubmitResult =
	| { outcome: "ok"; project: BusinessSubmittedProject }
	| { outcome: "not_found" }
	| { outcome: "invalid"; message: string; fields: FieldErrors }
	| { outcome: "conflict"; projectId: number };

export type ListResult =
	| { outcome: "ok"; projects: BusinessProjectSummary[] }
	| { outcome: "not_found" };

/** Slots that carry a document, for the checklist progress. */
function completedSlots(slots: string[]): { done: number; total: number } {
	const total = CHECKLIST_SLOTS.length;
	const done = CHECKLIST_SLOTS.filter((slot) => slots.includes(slot)).length;
	return { done, total };
}

/**
 * Turns a validated draft into a project: the scores are recomputed here and
 * never taken from the client, and the summary figures the rest of the app
 * reads (budget, energy and carbon targets) are derived from the submitted
 * inputs rather than left empty.
 */
export async function submitProject(
	db: GreenShiftDb,
	companyId: number,
	body: BusinessSubmitBody,
): Promise<SubmitResult> {
	const draft = await draftsRepository.findDraft(db, body.draftId, companyId);
	if (!draft) return { outcome: "not_found" };

	// Already submitted: answer with the project it produced instead of making
	// a second one.
	if (draft.projectId !== null) {
		return { outcome: "conflict", projectId: draft.projectId };
	}

	const files = await draftsRepository.listDraftDocuments(db, body.draftId);
	const slots = files.map((file) => file.slot);
	const { done, total } = completedSlots(slots);

	const fields: FieldErrors = {
		...step1Errors(body.step1),
		...step2Errors(body.step2, false, files.length),
	};
	if (body.consent !== true) fields.consent = CONSENT_MESSAGE;
	if (body.declaration !== true) fields.declaration = CONSENT_MESSAGE;

	// Every referenced file must belong to this draft, so a submit cannot attach
	// another draft's uploads. The same upload is legitimately referenced from
	// both Step 2 and a Step 3 slot, so this is de-duplicated before it is
	// compared against the number of rows actually found.
	const referenced = [
		...new Set([
			...(body.step2.fileIds ?? []),
			...Object.values(body.step3.docStates ?? {}).filter(
				(id): id is string => typeof id === "string",
			),
		]),
	];
	if (referenced.length > 0) {
		const owned = await draftsRepository.countOwnedDocuments(
			db,
			body.draftId,
			referenced,
		);
		if (owned !== referenced.length) {
			fields.fileIds = "This document is not attached to the draft.";
		}
	}

	if (Object.keys(fields).length > 0) {
		return {
			outcome: "invalid",
			message: validationSummary(Object.keys(fields).length),
			fields,
		};
	}

	const credit = creditScore({
		capex: body.step2.capexRp,
		tenor: body.step2.tenorTahun,
		saving: body.step2.penghematanRp,
		docsDone: done,
		docsTotal: total,
	});
	const risk = projectRisk({
		finansial: finansialTone(body.step1.biayaRp),
		teknis: teknisTone(body.step1.konsumsiMwh),
		implementasi: implementasiTone(body.step1.timeline),
		creditScore: credit.score,
		docsDone: done,
		docsTotal: total,
	});
	if (!risk) {
		return {
			outcome: "invalid",
			message: validationSummary(1),
			fields: { step1: "The project data is not complete enough to score." },
		};
	}

	const baselineTco2 = body.step1.konsumsiMwh * body.step1.faktorEmisi;
	const submittedAt = new Date();

	const project = await repository.insertProjectWithRisk(
		db,
		{
			companyId,
			title: body.step1.namaProyek.trim(),
			description: body.step1.ringkasan.trim(),
			status: "assessment",
			location: body.step1.lokasi.trim(),
			industrySector: body.step1.sektor,
			konsumsiMwh: body.step1.konsumsiMwh,
			biayaRp: body.step1.biayaRp,
			faktorEmisi: body.step1.faktorEmisi,
			targetPct: body.step1.targetPct,
			targetMwh: body.step1.targetMwh,
			timelineQuarter: body.step1.timeline.trim(),
			capexRp: body.step2.capexRp,
			tenorTahun: body.step2.tenorTahun,
			penghematanRp: body.step2.penghematanRp,
			pendapatanRp: body.step2.pendapatanRp,
			jaminan: body.step2.jaminan,
			creditScore: credit.score,
			creditRating: credit.rating,
			// Derived so the catalog and the vendor surfaces have something real
			// to show: the capital cost is the funding target, the energy target
			// converts MWh to kWh, and the carbon target is the requested share
			// of the measured baseline.
			budget: body.step2.capexRp,
			estimatedEnergySaving: body.step1.targetMwh * 1000,
			targetEmissionReduction: (baselineTco2 * body.step1.targetPct) / 100,
			riskScore: risk.score,
			riskSummary: risk.summary,
			submittedAt,
		},
		risk,
	);

	await repository.attachProjectToDraft(db, body.draftId, project.id);
	await documentsRepository.promoteDraftDocuments(db, body.draftId, project.id);

	return {
		outcome: "ok",
		project: {
			id: project.id,
			title: project.title,
			status: project.status,
			submittedAt: iso(project.submittedAt),
			baselineTco2,
			creditScore: credit.score,
			creditRating: credit.rating,
			riskScore: risk.score,
			riskLevel: risk.level,
		},
	};
}

/** The company's project table, newest first, drafts excluded. */
export async function listProjects(
	db: GreenShiftDb,
	companyId: number,
	limit: number,
): Promise<BusinessProjectSummary[]> {
	const rows = await repository.listCompanyProjects(db, companyId, limit);

	return rows.map((row) => ({
		id: row.id,
		name: row.title,
		location: row.location,
		sector: row.industrySector,
		submittedAt: iso(row.submittedAt),
		capexRp: row.capexRp,
		status: pillStatus(row.status),
	}));
}
