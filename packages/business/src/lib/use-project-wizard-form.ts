import { useAppForm } from "@greenshift/ui";

/** The wizard's field values: numbers stay as typed, Indonesian grouping and all, and convert at
 * the payload edge; `timeline` starts on a real quarter so it passes its own rule. */
export const WIZARD_VALUES = {
	namaProyek: "",
	lokasi: "",
	sektor: "",
	konsumsi: "",
	biaya: "",
	faktor: "",
	targetPct: "",
	targetMwh: "",
	timeline: "Q1 2026",
	ringkasan: "",
	capex: "",
	tenor: "",
	saving: "",
	pendapatan: "",
	jaminan: "",
	/* Step 3 holds two open-ended lists; each is one entry per line, not a fixed field set. */
	requirements: "",
	deliverables: "",
	consent: false,
	declaration: false,
};

export type WizardValues = typeof WIZARD_VALUES;
export type WizardFieldName = keyof WizardValues;

/** Step 1 fields, in the order the step renders them. */
export const STEP1_FIELDS = [
	"namaProyek",
	"lokasi",
	"sektor",
	"konsumsi",
	"biaya",
	"faktor",
	"targetPct",
	"targetMwh",
	"timeline",
	"ringkasan",
] as const satisfies readonly WizardFieldName[];

/** Step 2 fields, in the order the step renders them. */
export const STEP2_FIELDS = [
	"capex",
	"tenor",
	"saving",
	"pendapatan",
	"jaminan",
] as const satisfies readonly WizardFieldName[];

/** Step 3 fields, in the order the step renders them. */
export const STEP3_FIELDS = [
	"requirements",
	"deliverables",
] as const satisfies readonly WizardFieldName[];

/** One form for the whole wizard, three data steps plus the two review declarations, so a resume
 * seeds every step at once and the step views read the same values the shell does. */
export function useProjectWizardForm() {
	return useAppForm({ defaultValues: { ...WIZARD_VALUES } });
}

/** The form instance the step views render against; `ReturnType` is deliberate, since TanStack's
 * app-form type is generic over fifteen parameters and this alias names the shape once. */
export type WizardForm = ReturnType<typeof useProjectWizardForm>;
