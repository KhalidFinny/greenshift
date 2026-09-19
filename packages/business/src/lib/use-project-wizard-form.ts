import { useAppForm } from "@greenshift/ui";

/**
 * The wizard's field values.
 *
 * Every numeric entry stays the string the user typed, Indonesian grouping and
 * all, so a resumed value is shown back exactly as it was entered; conversion
 * happens at the edge, where the payload is built. `timeline` starts on a real
 * quarter rather than an empty select, which would otherwise fail its own rule
 * the moment the user looked at it.
 */
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

/**
 * One form for the whole wizard: the three data steps plus the two declarations
 * the review step gates submission on. A single instance means a resume seeds
 * every step at once, and the step views read the same values the shell does.
 */
export function useProjectWizardForm() {
	return useAppForm({ defaultValues: { ...WIZARD_VALUES } });
}

/**
 * The form instance the step views render against. `ReturnType` is deliberate:
 * TanStack's own app-form type is generic over fifteen parameters, and this
 * alias is the only place in the package that names the bundle's shape.
 */
export type WizardForm = ReturnType<typeof useProjectWizardForm>;
