// What the analyst model is told about a project's funding case: the figures, and what they say.

import type { BusinessProjectReadingRequest } from "../../../contracts";
import { ANALYST_VOICE } from "./analyst";

const SYSTEM_PROMPT = [
	ANALYST_VOICE,
	"",
	"Write two short paragraphs about this project's funding case for the",
	"company's own review before it submits. Open with what the capital buys and",
	"how it is financed, then say what the annual figures say about the repayment.",
	"Do not repeat the figures back at the reader: say what they mean.",
].join("\n");

export function rupiah(value: number): string {
	return `Rp ${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

export function percent(value: number): string {
	return `${Math.round(value)} per cent`;
}

/** The figures as they are read against each other. */
export interface PlanReading {
	annualRepayment: number | null;
	coveragePct: number | null;
	paybackYears: number | null;
	savingOfRevenuePct: number | null;
}

export function readPlan(input: BusinessProjectReadingRequest): PlanReading {
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
export function missingFigures(input: BusinessProjectReadingRequest): string[] {
	const missing: string[] = [];
	if (input.capexRp === null) missing.push("the capital requirement");
	if (input.tenorTahun === null) missing.push("the tenor");
	if (input.penghematanRp === null) missing.push("the annual saving");
	if (input.pendapatanRp === null) missing.push("the annual revenue");
	return missing;
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

// The derived values are given too, so the model reasons about the case instead of recomputing it.
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

export interface ProjectBrief {
	/** The figures the reading is about. Cached by this. */
	key: string;
	system: string;
	user: string;
}

export function projectBrief(
	input: BusinessProjectReadingRequest,
): ProjectBrief {
	return {
		key: `project:${readingSignature(input)}`,
		system: SYSTEM_PROMPT,
		user: asBrief(input, readPlan(input)),
	};
}
