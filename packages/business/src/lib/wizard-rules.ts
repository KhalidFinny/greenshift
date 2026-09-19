import { parseIdNumber } from "./number-format";
import type { WizardForm, WizardValues } from "./use-project-wizard-form";
import {
	type Step1Values,
	type Step2Values,
	validateStep1,
	validateStep2,
} from "./validators";

/**
 * The bridge between the wizard's form values (strings, as typed) and the
 * per-step rule sets in `validators.ts` (numbers and counts). Both the shell
 * (gating a step, submitting) and the field components (inline messages) go
 * through here, so one rule set stays the only source of every message.
 */
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

/**
 * One field's message from Step 1's rule set. The rules each read only their own
 * value, and the validator runs against live form state, so a field reports the
 * same sentence the step gate does.
 */
export function step1Validator(form: WizardForm, key: keyof Step1Values) {
	return () => validateStep1(step1Values(form.state.values))[key];
}

/**
 * One field's message from Step 2's rule set.
 *
 * The `files` rule belongs to the upload zone rather than to any input, and the
 * shell reports it there. Validating a text field must not fail over a missing
 * file, so the count is treated as satisfied here and only the step gate has the
 * real number.
 */
export function step2Validator(form: WizardForm, key: keyof Step2Values) {
	return () => validateStep2(step2Values(form.state.values, 1))[key];
}
