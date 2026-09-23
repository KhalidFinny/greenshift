import type {
	BusinessProjectSummary,
	BusinessSubmitBody,
	BusinessSubmittedProject,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { projects } from "../../../db/schema";
import { iso } from "../../../lib/format";
import {
	creditScore,
	finansialTone,
	implementasiTone,
	levelForRiskScore,
	projectRisk,
	teknisTone,
} from "../business.scoring";
import { CHECKLIST_SLOTS, pillStatus, scopeEntries } from "../business.shared";
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
import { generateBlueprint } from "../forecast/forecast.service";
import { runMatching } from "../matchmaking/matching.service";
import { insertNotification } from "../notifications/notifications.repository";
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
		...step3Errors(body.step3),
	};
	if (body.consent !== true) fields.consent = CONSENT_MESSAGE;
	if (body.declaration !== true) fields.declaration = CONSENT_MESSAGE;

	// Every referenced file must belong to this draft, so a submit cannot attach
	// another draft's uploads. De-duplicated, because one upload can legitimately
	// be listed twice, and compared against the rows actually found.
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
			// The next move is the company's: the project has to be registered at
			// the environmental registry and an LVV body appointed before the body
			// can verify anything, so a submission lands on `registry` rather than
			// straight with the body.
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
			// The scope of work the tender is bid against: the company's own
			// requirements, which the matching model also reads, and what the
			// delivery is expected to hand over.
			technicalRequirements: scopeEntries(body.step3.requirements),
			deliverables: scopeEntries(body.step3.deliverables),
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

	// Verification is not the platform's to start: the company registers the
	// project at Sistem Registri, uploads the verification documents there and
	// appoints the LVV body, then marks it registered on the project's page. The
	// reminder is what tells them so, and it stays until they do.
	await insertNotification(db, {
		userId: companyId,
		type: "verification",
		title: "Register your project for LVV verification",
		body: `"${project.title}" is on record. Register it at Sistem Registri, upload the verification documents there, and appoint the LVV body that will verify it. Verification starts when you mark it registered.`,
		link: `/business/projects/${project.id}`,
	});

	return { outcome: "ok", project: toSubmittedProject(project) };
}

export type StartLvvResult =
	| { outcome: "ok"; project: BusinessSubmittedProject }
	| { outcome: "not_found" }
	| { outcome: "conflict"; status: string };

/**
 * The company's half of verification: the project has been registered at the
 * registry and an LVV body appointed, so the body can start.
 *
 * Only a project waiting on its registration can start: a second press, or a
 * project already with the body, changes nothing and says so. The verdict
 * arrives out of band (`completeLvvReview`), so this answers with the project
 * as it stands, in `assessment`.
 */
export async function startLvvVerification(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<StartLvvResult> {
	const row = await repository.findCompanyProject(db, projectId, companyId);
	if (!row) return { outcome: "not_found" };
	if (row.status !== "registry") {
		return { outcome: "conflict", status: row.status };
	}

	await repository.setProjectStatus(db, projectId, "assessment");

	return {
		outcome: "ok",
		project: toSubmittedProject({ ...row, status: "assessment" }),
	};
}

/**
 * The submitted project as the app reads it back. The scores and the baseline
 * are the stored figures rather than a second derivation, and the risk level
 * follows from the stored score, so every screen that shows the project agrees
 * with the submission that created it.
 */
export function toSubmittedProject(
	row: typeof projects.$inferSelect,
): BusinessSubmittedProject {
	return {
		id: row.id,
		title: row.title,
		status: row.status,
		statusLabel: pillStatus(row.status),
		submittedAt: iso(row.submittedAt),
		baselineTco2:
			row.konsumsiMwh !== null && row.faktorEmisi !== null
				? row.konsumsiMwh * row.faktorEmisi
				: null,
		creditScore: row.creditScore,
		creditRating: row.creditRating,
		riskScore: row.riskScore,
		riskLevel: row.riskScore === null ? null : levelForRiskScore(row.riskScore),
		location: row.location,
		sector: row.industrySector,
		funding: {
			capexRp: row.capexRp,
			tenorTahun: row.tenorTahun,
			penghematanRp: row.penghematanRp,
			pendapatanRp: row.pendapatanRp,
			jaminan: row.jaminan,
		},
		technicalRequirements: row.technicalRequirements ?? [],
		deliverables: row.deliverables ?? [],
	};
}

/** One submitted project, scoped to the company that owns it. */
export async function readProject(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<BusinessSubmittedProject | null> {
	const row = await repository.findCompanyProject(db, projectId, companyId);
	return row ? toSubmittedProject(row) : null;
}

/**
 * Waits without holding the isolate's CPU, which is what `waitUntil` needs.
 * The executor form is deliberate: `Promise.withResolvers` is not in this
 * project's type lib, and a timer callback is the whole body.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * What the environmental registry answers about a project.
 *
 * The verification body checks a project against the environmental registry;
 * the platform has no integration with that registry yet, so this stands in for
 * the call and reports the outcome the body would report. A real integration
 * replaces this function and nothing else: the caller only reads the verdict.
 *
 * Two callers read it: the verification flow, deciding whether a project may
 * proceed, and the project's own page, telling a company that registered the
 * project there but has not started verification here.
 */
export interface RegistryCheck {
	registered: boolean;
	/** What the registry is answering about, for the record. */
	subject: string;
}

export async function checkEnvironmentalRegistry(
	title: string,
): Promise<RegistryCheck> {
	await sleep(REGISTRY_LOOKUP_MS);
	return { registered: true, subject: title };
}

/** How long the verification body takes to answer, in this flow. */
const LVV_REVIEW_MS = 10_000;
/** How long the registry lookup takes, before the body's own verdict. */
const REGISTRY_LOOKUP_MS = 1_000;

/**
 * The verification body's answer, after the wait the real one takes.
 *
 * Order matters and mirrors the real chain: the registry is asked first, and
 * only a project it knows about is moved on. A verified project then goes
 * straight into the matching table, so the vendors are ranked before the company
 * ever opens the screen, and the notification carries how many were scored.
 *
 * A deployed flow would have the body's callback (or a queue) own this rather
 * than a timer inside the request.
 */
export async function completeLvvReview(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	title: string,
): Promise<void> {
	await sleep(LVV_REVIEW_MS);

	const registry = await checkEnvironmentalRegistry(title);
	if (!registry.registered) {
		await insertNotification(db, {
			userId: companyId,
			type: "verification",
			title: "Verification needs attention",
			body: `The environmental registry has no record for "${title}". Upload the site permit and registration documents, then the review continues.`,
			link: "/business/projects",
		});
		return;
	}

	// Verification clears the project into matchmaking, and the matching run
	// ranks its vendor pool in the same pass: the screen the company opens is
	// already populated.
	//
	// The Green Project Blueprint is generated here, from the figures the
	// company submitted, because verification is what makes them usable: the
	// bidders on the project read the blueprint's funding case and emission
	// targets while the tender is open.
	const project = await repository.findCompanyProject(db, projectId, companyId);
	const blueprintId = project ? await generateBlueprint(db, project) : null;

	const matching = await runMatching(db, projectId);
	await repository.setProjectStatus(db, projectId, "tendering");

	const shortlist =
		matching && matching.shortlist.length > 0
			? ` The matching run scored ${matching.scored} verified vendor${matching.scored === 1 ? "" : "s"}; ${matching.shortlist.map((vendor) => vendor.name).join(", ")} lead the ranking.`
			: " No verified vendor could be scored yet, so the ranking will fill in as vendor profiles are verified.";

	await insertNotification(db, {
		userId: companyId,
		type: "verification",
		title: "Project verified by LVV",
		body: `"${title}" passed verification${
			blueprintId === null
				? ""
				: ", and its Green Project Blueprint is ready for bidders"
		}. Vendor matchmaking is open: choose a vendor when you are ready.${shortlist}`,
		link: "/business/matchmaking",
	});
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
