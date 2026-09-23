// Turning a validated draft into a project. Scores are recomputed here, never taken from the client.

import type {
	BusinessSubmitBody,
	BusinessSubmittedProject,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	creditScore,
	finansialTone,
	implementasiTone,
	projectRisk,
	teknisTone,
} from "../business.scoring";
import { CHECKLIST_SLOTS, scopeEntries } from "../business.shared";
import {
	CONSENT_MESSAGE,
	type FieldErrors,
	step1Errors,
	step2Errors,
	step3Errors,
	validationSummary,
} from "../business.validation";
import * as documentsRepository from "../documents/documents.repository";
import * as draftsRepository from "../drafts/drafts.repository";
import { insertNotification } from "../notifications/notifications.repository";
import { toSubmittedProject } from "./project-view";
import * as repository from "./projects.repository";

export type SubmitResult =
	| { outcome: "ok"; project: BusinessSubmittedProject }
	| { outcome: "not_found" }
	| { outcome: "invalid"; message: string; fields: FieldErrors }
	| { outcome: "conflict"; projectId: number };

/** Slots that carry a document, for the checklist progress. */
function completedSlots(slots: string[]): { done: number; total: number } {
	const total = CHECKLIST_SLOTS.length;
	const done = CHECKLIST_SLOTS.filter((slot) => slots.includes(slot)).length;
	return { done, total };
}

export async function submitProject(
	db: GreenShiftDb,
	companyId: number,
	body: BusinessSubmitBody,
): Promise<SubmitResult> {
	const draft = await draftsRepository.findDraft(db, body.draftId, companyId);
	if (!draft) return { outcome: "not_found" };

	// A replay answers with the project the draft already produced.
	if (draft.projectId !== null) {
		return { outcome: "conflict", projectId: draft.projectId };
	}

	const files = await draftsRepository.listDraftDocuments(db, body.draftId);
	const slots = files.map((file) => file.slot);
	const { done, total } = completedSlots(slots);

	const fields: FieldErrors = {
		...step1Errors(body.step1),
		...step2Errors(body.step2, false, files.length),
		...step3Errors(body.step3),
	};
	if (body.consent !== true) fields.consent = CONSENT_MESSAGE;
	if (body.declaration !== true) fields.declaration = CONSENT_MESSAGE;

	// Every referenced file must belong to this draft, so a submit cannot attach another draft's uploads.
	const referenced = [...new Set(body.step2.fileIds ?? [])];
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
			// The company registers at the registry and appoints an LVV body first, so a submission lands on `registry`.
			status: "registry",
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
			// The scope of work the tender is bid against: what the matching model and the delivery both read.
			technicalRequirements: scopeEntries(body.step3.requirements),
			deliverables: scopeEntries(body.step3.deliverables),
			// Derived so the catalog and the vendor surfaces carry real figures.
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

	// The reminder stays until the company registers the project and appoints its LVV body.
	await insertNotification(db, {
		userId: companyId,
		type: "verification",
		title: "Register your project for LVV verification",
		body: `"${project.title}" is on record. Register it at Sistem Registri, upload the verification documents there, and appoint the LVV body that will verify it. Verification starts when you mark it registered.`,
		link: `/business/projects/${project.id}`,
	});

	return { outcome: "ok", project: toSubmittedProject(project) };
}
