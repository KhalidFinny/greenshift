// The reading the review step opens with, written from Steps 1 and 2 only.

import type {
	BusinessProjectReadingRequest,
	BusinessRiskInsight,
} from "../../../contracts";
import type { Env } from "../../../env";
import { analystReading } from "./analyst";
import {
	missingFigures,
	percent,
	projectBrief,
	readPlan,
	rupiah,
} from "./reading-prompts";

// Every sentence traces to an input and what is missing is named, so it stands in when the model is down.
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

export async function projectReading(
	env: Env,
	input: BusinessProjectReadingRequest,
): Promise<BusinessRiskInsight> {
	return analystReading(env, {
		...projectBrief(input),
		fallback: composeProjectReading(input),
	});
}
