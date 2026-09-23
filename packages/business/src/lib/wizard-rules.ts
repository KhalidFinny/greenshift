import { parseIdNumber } from "./number-format";
import type { WizardForm, WizardValues } from "./use-project-wizard-form";
import {
	type Step1Values,
	type Step2Values,
	type Step3Values,
	validateStep1,
	validateStep2,
	validateStep3,
} from "./validators";

/** One entry per line: what the scope lists are typed as, and what they store. */
export function scopeLines(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

/** The bridge from the form's typed strings to `validators.ts` numbers and counts; the shell and
 * the field components both go through here, so one rule set is the only source of messages. */
export function step1Values(values: WizardValues): Step1Values {
	return {
		namaProyek: values.namaProyek,
		lokasi: values.lokasi,
		sektor: values.sektor,
		konsumsi: parseIdNumber(values.konsumsi),
		biaya: parseIdNumber(values.biaya),
		faktor: parseIdNumber(values.faktor),
		targetPct: parseIdNumber(values.targetPct),
		targetMwh: parseIdNumber(values.targetMwh),
		timeline: values.timeline,
		ringkasan: values.ringkasan,
	};
}

export function step2Values(
	values: WizardValues,
	fileCount: number,
): Step2Values {
	return {
		capex: parseIdNumber(values.capex),
		tenor: parseIdNumber(values.tenor),
		saving: parseIdNumber(values.saving),
		pendapatan: parseIdNumber(values.pendapatan),
		jaminan: values.jaminan,
		fileCount,
	};
}

/** One field's message from Step 1's rule set, read against live form state, so the field reports
 * the same sentence the step gate does. */
export function step1Validator(form: WizardForm, key: keyof Step1Values) {
	return () => validateStep1(step1Values(form.state.values))[key];
}

/** One field's message from Step 2's rule set. The `files` rule belongs to the upload zone, so a
 * text field must not fail over a missing file and the count is treated as satisfied here. */
export function step2Validator(form: WizardForm, key: keyof Step2Values) {
	return () => validateStep2(step2Values(form.state.values, 1))[key];
}

export function step3Values(values: WizardValues): Step3Values {
	return {
		requirements: scopeLines(values.requirements),
		deliverables: scopeLines(values.deliverables),
	};
}

/** One field's message from Step 3's rule set. */
export function step3Validator(form: WizardForm, key: keyof Step3Values) {
	return () => validateStep3(step3Values(form.state.values))[key];
}
