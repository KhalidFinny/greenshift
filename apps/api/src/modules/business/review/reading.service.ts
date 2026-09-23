/* The reading the review step opens with: the project and its funding case in the
 * analyst's words. Written from Steps 1 and 2 only; ratios are arithmetic over them. */

import type {
	BusinessProjectReadingRequest,
	BusinessRiskInsight,
} from "../../../contracts";
import type { Env } from "../../../env";
import { ANALYST_VOICE, analystReading } from "./analyst";

const SYSTEM_PROMPT = [
	ANALYST_VOICE,
	"",
	"Write two short paragraphs about this project's funding case for the",
	"company's own review before it submits. Open with what the capital buys and",
	"how it is financed, then say what the annual figures say about the repayment.",
	"Do not repeat the figures back at the reader: say what they mean.",
].join("\n");

/** Rupiah with Indonesian grouping, the way the screens show it. */
function rupiah(value: number): string {
	return `Rp ${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

function percent(value: number): string {
	return `${Math.round(value)} per cent`;
}

/** The figures as they are read against each other. */
interface PlanReading {
	annualRepayment: number | null;
	coveragePct: number | null;
	paybackYears: number | null;
	savingOfRevenuePct: number | null;
}

function readPlan(input: BusinessProjectReadingRequest): PlanReading {
	const { capexRp, tenorTahun, penghematanRp, pendapatanRp } = input;
	const annualRepayment =
		capexRp !== null && tenorTahun !== null && tenorTahun > 0
			? capexRp / tenorTahun
			: null;
	return {
		annualRepayment,
		coveragePct:
			annualRepayment !== null && annualRepayment > 0 && penghematanRp !== null
				? (penghematanRp / annualRepayment) * 100
				: null,
		paybackYears:
			capexRp !== null &&
			capexRp > 0 &&
			penghematanRp !== null &&
			penghematanRp > 0
				? capexRp / penghematanRp
				: null,
		savingOfRevenuePct:
			pendapatanRp !== null && pendapatanRp > 0 && penghematanRp !== null
				? (penghematanRp / pendapatanRp) * 100
				: null,
	};
}

/** Which figure is missing, so a provisional reading says so instead of guessing. */
function missingFigures(input: BusinessProjectReadingRequest): string[] {
	const missing: string[] = [];
	if (input.capexRp === null) missing.push("the capital requirement");
	if (input.tenorTahun === null) missing.push("the tenor");
	if (input.penghematanRp === null) missing.push("the annual saving");
	if (input.pendapatanRp === null) missing.push("the annual revenue");
	return missing;
}

// The reading composed from the figures alone, in the analyst's voice. Every sentence
// traces to an input and what is missing is named, so it is safe when the model is down.
export function composeProjectReading(
	input: BusinessProjectReadingRequest,
): string {
	const plan = readPlan(input);
	const missing = missingFigures(input);
	const name = input.namaProyek.trim() || "This project";
	const place = [input.lokasi.trim(), input.sektor.trim()]
		.filter(Boolean)
		.join(", ");

	const first: string[] = [];
	first.push(
		place
			? `${name} is an energy project at ${place}, with a capital requirement of ${input.capexRp === null ? "an unfilled figure" : rupiah(input.capexRp)}${
					input.tenorTahun === null
						? " and no tenor yet"
						: ` taken over ${input.tenorTahun} years`
				}.`
			: `${name} has a capital requirement of ${input.capexRp === null ? "an unfilled figure" : rupiah(input.capexRp)}${
					input.tenorTahun === null
						? " and no tenor yet"
						: ` taken over ${input.tenorTahun} years`
				}.`,
	);
	first.push(
		plan.annualRepayment === null
			? "The annual repayment follows from the capital and the tenor, and neither is complete yet."
			: `That is an annual repayment of ${rupiah(plan.annualRepayment)}, before any financing cost.`,
	);

	const second: string[] = [];
	if (plan.coveragePct === null) {
		second.push(
			"The annual saving has not been entered, so the repayment has nothing measured against it yet.",
		);
	} else {
		second.push(
			`The annual saving covers ${percent(plan.coveragePct)} of that repayment, ${
				plan.coveragePct >= 100
					? "so the project services the debt out of the energy it saves."
					: "so the balance has to come out of operations."
			}`,
		);
	}
	if (plan.paybackYears !== null) {
		const withinTenor =
			input.tenorTahun !== null && plan.paybackYears <= input.tenorTahun;
		second.push(
			`At this saving the capital is recovered in ${plan.paybackYears.toFixed(1)} years, ${
				input.tenorTahun === null
					? "against a tenor that is not set."
					: withinTenor
						? `inside the ${input.tenorTahun}-year tenor.`
						: `past the ${input.tenorTahun}-year tenor.`
			}`,
		);
	}
	if (plan.savingOfRevenuePct !== null) {
		second.push(
			`The saving is ${percent(plan.savingOfRevenuePct)} of the company's annual revenue.`,
		);
	}
	if (input.jaminan) {
		second.push(`The filing carries ${input.jaminan} as collateral.`);
	}
	if (missing.length > 0) {
		second.push(
			`This reading is provisional: it still needs ${missing.join(", ")}.`,
		);
	}

	return `${first.join(" ")}\n\n${second.join(" ")}`;
}

/** The figures the reading is about: any of them changing changes the reading. */
function readingSignature(input: BusinessProjectReadingRequest): string {
	return [
		input.namaProyek,
		input.lokasi,
		input.sektor,
		input.capexRp,
		input.tenorTahun,
		input.penghematanRp,
		input.pendapatanRp,
		input.jaminan,
	].join("|");
}

/** A figure as the model should read it, with what is missing said so. */
function stated(value: number | null): string {
	return value === null ? "not provided" : rupiah(value);
}

// The figures as a brief, derived values included, so the model reasons about the case
// instead of recomputing it and cannot mistake a ratio for an input.
function asBrief(
	input: BusinessProjectReadingRequest,
	plan: PlanReading,
): string {
	return [
		`Project: ${input.namaProyek.trim() || "unnamed"}.`,
		`Location and sector: ${[input.lokasi.trim(), input.sektor.trim()].filter(Boolean).join(", ") || "not provided"}.`,
		`Capital requirement: ${stated(input.capexRp)}.`,
		`Tenor: ${input.tenorTahun === null ? "not provided" : `${input.tenorTahun} years`}.`,
		`Annual saving: ${stated(input.penghematanRp)}.`,
		`Annual revenue: ${stated(input.pendapatanRp)}.`,
		`Collateral: ${input.jaminan?.trim() || "not provided"}.`,
		`Derived from those figures: annual repayment ${stated(plan.annualRepayment)}; the saving covers ${
			plan.coveragePct === null
				? "an uncomputable share"
				: `${Math.round(plan.coveragePct)} per cent`
		} of it; the capital is recovered in ${
			plan.paybackYears === null
				? "an uncomputable period"
				: `${plan.paybackYears.toFixed(1)} years`
		}; the saving is ${
			plan.savingOfRevenuePct === null
				? "an uncomputable share"
				: `${Math.round(plan.savingOfRevenuePct)} per cent`
		} of revenue.`,
	].join("\n");
}

export async function projectReading(
	env: Env,
	input: BusinessProjectReadingRequest,
): Promise<BusinessRiskInsight> {
	const plan = readPlan(input);
	return analystReading(env, {
		key: `project:${readingSignature(input)}`,
		system: SYSTEM_PROMPT,
		user: asBrief(input, plan),
		fallback: composeProjectReading(input),
	});
}
