/** The draft's wire format, kept out of the views so the field names the API expects appear in one file. */

import type {
	BusinessDraftDocument,
	BusinessStep1Patch,
	BusinessStep2Patch,
	BusinessStep3Patch,
} from "@greenshift/core";
import { formatId, parseIdNumber } from "./number-format";
import type { DraftResume } from "./use-business-draft";
import { WIZARD_VALUES, type WizardValues } from "./use-project-wizard-form";
import { scopeLines } from "./wizard-rules";

export interface WizardFile {
	id: string;
	name: string;
	sizeBytes: number | null;
}

export interface SlotFiles {
	names: Record<string, string>;
	ids: Record<string, string>;
}

export interface WizardFiles {
	step2: WizardFile[];
	bySlot: Map<string, WizardFile>;
}

/** A blank field is absent, not an empty string: the API reads `""` as a value. */
function orNull(value: string): string | null {
	return value.trim() ? value : null;
}

/** A resumed number keeps the display format its field expects back. */
function formatField(value: number): string {
	return formatId(value, Number.isInteger(value) ? 0 : 2);
}

/** Every key of the step is present; a blank string or unparseable number goes as null, which the server's partial merge reads as cleared. */
export function step1Patch(values: WizardValues): BusinessStep1Patch {
	return {
		namaProyek: orNull(values.namaProyek),
		lokasi: orNull(values.lokasi),
		sektor: orNull(values.sektor),
		konsumsiMwh: parseIdNumber(values.konsumsi),
		biayaRp: parseIdNumber(values.biaya),
		faktorEmisi: parseIdNumber(values.faktor),
		targetPct: parseIdNumber(values.targetPct),
		targetMwh: parseIdNumber(values.targetMwh),
		timeline: orNull(values.timeline),
		ringkasan: orNull(values.ringkasan),
	};
}

/** The Step 2 block. The file list comes from the draft, not from the form. */
export function step2Patch(
	values: WizardValues,
	fileIds: string[],
): BusinessStep2Patch {
	return {
		capexRp: parseIdNumber(values.capex),
		tenorTahun: parseIdNumber(values.tenor),
		penghematanRp: parseIdNumber(values.saving),
		pendapatanRp: parseIdNumber(values.pendapatan),
		jaminan: orNull(values.jaminan),
		fileIds,
	};
}

export function step3Patch(values: WizardValues): BusinessStep3Patch {
	return {
		requirements: scopeLines(values.requirements),
		deliverables: scopeLines(values.deliverables),
	};
}

/** The stored draft in the form's shape; numbers return through formatField, so the value shown is the one the user typed. */
export function resumeValues(resume: DraftResume): WizardValues {
	const step1 = resume.step1 ?? {};
	const step2 = resume.step2 ?? {};
	const step3 = resume.step3 ?? {};
	const asField = (value: number | null | undefined, fallback: string) =>
		value != null ? formatField(value) : fallback;
	return {
		...WIZARD_VALUES,
		namaProyek: step1.namaProyek ?? WIZARD_VALUES.namaProyek,
		lokasi: step1.lokasi ?? WIZARD_VALUES.lokasi,
		sektor: step1.sektor ?? WIZARD_VALUES.sektor,
		konsumsi: asField(step1.konsumsiMwh, WIZARD_VALUES.konsumsi),
		biaya: asField(step1.biayaRp, WIZARD_VALUES.biaya),
		faktor: asField(step1.faktorEmisi, WIZARD_VALUES.faktor),
		targetPct: asField(step1.targetPct, WIZARD_VALUES.targetPct),
		targetMwh: asField(step1.targetMwh, WIZARD_VALUES.targetMwh),
		timeline: step1.timeline ?? WIZARD_VALUES.timeline,
		ringkasan: step1.ringkasan ?? WIZARD_VALUES.ringkasan,
		capex: asField(step2.capexRp, WIZARD_VALUES.capex),
		tenor: asField(step2.tenorTahun, WIZARD_VALUES.tenor),
		saving: asField(step2.penghematanRp, WIZARD_VALUES.saving),
		pendapatan: asField(step2.pendapatanRp, WIZARD_VALUES.pendapatan),
		jaminan: step2.jaminan ?? WIZARD_VALUES.jaminan,
		requirements: (step3.requirements ?? []).join("\n"),
		deliverables: (step3.deliverables ?? []).join("\n"),
	};
}

/** The blocks hold ids only, so names and sizes come from the document list; Steps 1/3 keep the last upload per slot, Step 2 is read by id. */
export function resumeFiles(
	documents: BusinessDraftDocument[],
	step2FileIds: string[],
): WizardFiles {
	const byId = new Map<string, WizardFile>();
	const bySlot = new Map<string, WizardFile>();
	for (const doc of documents) {
		const file: WizardFile = {
			id: doc.id,
			name: doc.fileName,
			sizeBytes: doc.sizeBytes,
		};
		byId.set(doc.id, file);
		bySlot.set(doc.slot, file);
	}

	return {
		step2: step2FileIds.flatMap((id) => {
			const file = byId.get(id);
			return file ? [file] : [];
		}),
		bySlot,
	};
}

export function slotFiles(
	bySlot: Map<string, WizardFile>,
	slots: readonly string[],
): SlotFiles {
	const names: Record<string, string> = {};
	const ids: Record<string, string> = {};
	for (const slot of slots) {
		const file = bySlot.get(slot);
		if (!file) continue;
		names[slot] = file.name;
		ids[slot] = file.id;
	}
	return { names, ids };
}
