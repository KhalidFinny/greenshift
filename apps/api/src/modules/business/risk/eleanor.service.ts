import type {
	AnalystReadingMode,
	BusinessRiskInsight,
	BusinessRiskInsightBody,
} from "../../../contracts";
import type { Env } from "../../../env";
import { ANALYST_VOICE, analystReading, joinWords } from "../review/analyst";

// Eleanor, the risk analyst on the review step: she reads the assessment the platform produced.

const FULL_SYSTEM_PROMPT = [
	ANALYST_VOICE,
	"",
	"Write three short paragraphs of plain professional English. Open with what",
	"the overall score means for the decision, then explain the areas driving it,",
	"then say what the company should do next. Refer to the areas by name and",
	"describe what they imply rather than repeating the figures back.",
].join("\n");

const BRIEF_SYSTEM_PROMPT = [
	ANALYST_VOICE,
	"",
	"Write two short sentences: what the score means for the decision, and which",
	"area drives it. Nothing else. Do not repeat the figures back at the reader.",
].join("\n");

/** The assessment as a brief, so the model reasons about it instead of echoing it. */
function asBrief(risk: BusinessRiskInsightBody): string {
	const areas = risk.breakdown
		.map(
			(row) => `${row.label} ${row.pct} of 100 (${row.tone ?? "not provided"})`,
		)
		.join("; ");
	const lines = [
		`Overall risk score: ${risk.score} of 100, band ${risk.level}.`,
		`Probability of success: ${risk.success} per cent.`,
		`Areas, where a higher number is more risk: ${areas}.`,
	];
	if (risk.factors.length > 0) {
		lines.push(`Flagged by the scoring model: ${risk.factors.join("; ")}.`);
	}
	if (risk.mitigations.length > 0) {
		lines.push(`Standing mitigations on file: ${risk.mitigations.join(" ")}`);
	}
	return lines.join("\n");
}

/** What an area means when it is the one carrying the assessment's weight. */
const AREA_READING: Record<string, string> = {
	finansial:
		"Energy spend at this level leaves the financial case with thin cover, which puts the saving assumption under real pressure.",
	teknis:
		"The consumption base is large enough that a wrong technical assumption scales with it.",
	implementasi:
		"The operation date is near enough that permitting or construction slippage lands on the critical path.",
	pembiayaan:
		"The credit profile raises the cost of the debt the project depends on.",
};

// An area is only called a pressure when the model banded it as one, so the prose never argues with the number.
export function composeInsight(risk: BusinessRiskInsightBody): string {
	const answered = risk.breakdown.filter((row) => row.tone !== null);
	if (answered.length === 0) {
		return "The assessment has no scored areas yet. Fill in the energy figures on the first step and the financial figures on the second, and this reading follows from them.";
	}

	const ranked = [...answered].sort((a, b) => b.pct - a.pct);
	const pressure = ranked.filter(
		(row) => row.tone === "High" || row.tone === "Medium",
	);
	const worst = pressure[0] ?? null;
	const runnerUp = pressure[1] ?? null;
	const heavy = ranked.filter((row) => row.tone === "High");
	const light = ranked.filter((row) => row.tone === "Low");
	const unanswered = risk.breakdown.filter((row) => row.tone === null);
	const paragraphs: string[] = [];

	if (risk.level === "High") {
		paragraphs.push(
			`A score of ${risk.score} of 100 places this project in the high risk band, with a ${risk.success} per cent probability of success. As it stands the financing case cannot absorb the weaknesses underneath it, and a reviewer would reach those weaknesses before reaching the merits of the project.`,
		);
	} else if (risk.level === "Low") {
		paragraphs.push(
			`A score of ${risk.score} of 100 places this project in the low risk band, with a ${risk.success} per cent probability of success. The profile holds together: the scored areas sit where a project of this size would expect them, and none of them is carrying the case alone.`,
		);
	} else {
		paragraphs.push(
			`A score of ${risk.score} of 100 places this project in the medium risk band, with a ${risk.success} per cent probability of success. The case is fundable, but the areas below have to be answered before it is comfortable.`,
		);
	}

	if (worst === null) {
		paragraphs.push(
			"Nothing in the assessment sits in the high band. The score is the average of four ordinary areas rather than the mark of one weak link.",
		);
	} else {
		const reading =
			AREA_READING[worst.key] ??
			"This area sets the ceiling for the rest of the case.";
		const trailing = runnerUp
			? ` ${runnerUp.label} follows at ${runnerUp.pct} of 100, so the two move together.`
			: "";
		paragraphs.push(
			`${worst.label} carries the most weight at ${worst.pct} of 100. ${reading}${trailing}`,
		);
	}

	if (heavy.length > 1) {
		paragraphs.push(
			`${joinWords(heavy.map((row) => row.label))} each sit in the high band, which is where the committee will spend its questions.`,
		);
	}

	if (unanswered.length > 0) {
		paragraphs.push(
			`${joinWords(unanswered.map((row) => row.label))} ${unanswered.length === 1 ? "has" : "have"} no input yet, so this score is provisional: it will move once those fields are filled in.`,
		);
	}

	if (light.length > 0) {
		paragraphs.push(
			`${joinWords(light.map((row) => row.label))} ${light.length === 1 ? "reads" : "read"} as the project's firmest ground, and that is what the rest of the case can lean on.`,
		);
	}

	if (risk.factors.length > 0) {
		paragraphs.push(
			`The assessment flags the following: ${risk.factors.map((factor) => factor.toLowerCase()).join("; ")}.`,
		);
	}

	if (risk.level === "Low" && unanswered.length === 0) {
		paragraphs.push(
			"Nothing here needs remediation before submission. Keep the evidence pack current, because verification re-reads it.",
		);
	} else if (risk.mitigations.length > 0) {
		paragraphs.push(
			`The work that moves this score: ${risk.mitigations.join(" ")}`,
		);
	}

	return paragraphs.join("\n\n");
}

/** The assessment's identity: the figures that would change the reading. */
function riskSignature(risk: BusinessRiskInsightBody): string {
	return [
		risk.score,
		risk.level,
		risk.success,
		...risk.breakdown.map((row) => `${row.key}:${row.pct}`),
	].join("|");
}

// Same discipline as the full reading: each sentence traces back to an input.
export function composeBriefInsight(risk: BusinessRiskInsightBody): string {
	const answered = risk.breakdown.filter((row) => row.tone !== null);
	if (answered.length === 0) {
		return "The assessment has no scored areas yet, so there is nothing to read until the steps behind it are filled in.";
	}

	const ranked = [...answered].sort((a, b) => b.pct - a.pct);
	const worst = ranked[0];
	const band =
		risk.level === "High" ? "high" : risk.level === "Low" ? "low" : "medium";
	const unanswered = risk.breakdown.filter((row) => row.tone === null);

	return [
		`A score of ${risk.score} of 100 puts this project in the ${band} risk band, with a ${risk.success} per cent probability of success.`,
		unanswered.length > 0
			? `${worst.label} carries the most weight at ${worst.pct} of 100, and ${joinWords(unanswered.map((row) => row.label))} ${unanswered.length === 1 ? "has" : "have"} no input yet, so the score will move.`
			: `${worst.label} carries the most weight at ${worst.pct} of 100.`,
	].join(" ");
}

export async function eleanorInsight(
	env: Env,
	risk: BusinessRiskInsightBody,
	mode: AnalystReadingMode = "full",
): Promise<BusinessRiskInsight> {
	const brief = mode === "brief";
	return analystReading(env, {
		key: `${mode}:${riskSignature(risk)}`,
		system: brief ? BRIEF_SYSTEM_PROMPT : FULL_SYSTEM_PROMPT,
		user: asBrief(risk),
		fallback: brief ? composeBriefInsight(risk) : composeInsight(risk),
	});
}
