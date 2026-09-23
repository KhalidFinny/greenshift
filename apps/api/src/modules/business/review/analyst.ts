/* The analyst model, and the reading it writes.
 *
 * Eleanor's two subjects (an assessment, a project's funding case) differ only
 * in what they are told and what she is asked to write, so the call, the cache
 * and the fallback live here once. Every reading is cached against the figures
 * it was written about: the same figures read the same way, and A fails to the
 * composed reading rather than to a spinner.
 */

import type { BusinessRiskInsight } from "../../../contracts";
import type { Env } from "../../../env";
import { aiAnswerText } from "../../../lib/ai-answer";

/** Small and fast, and on the free Workers AI allowance. */
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
/** The same figures read the same way, so the model runs once an hour. */
const CACHE_TTL_SECONDS = 60 * 60;
const CACHE_PREFIX = "eleanor:v3:";
/** Longer than this is a provider misfire rather than a reading. */
const MAX_READING_CHARS = 2400;
const MAX_TOKENS = 700;

/** The persona every subject is written in. */
export const ANALYST_VOICE = [
	"You are Eleanor, the risk analyst for a platform that finances industrial",
	"energy projects in Indonesia. You write for the credit committee that reads a",
	"project before deciding whether it moves forward.",
	"Ground every sentence in the figures you are given: never invent a number, a",
	"name, a date or a fact, and never describe yourself as an AI. Write prose",
	"only: no headings, no bullet points, no markdown, no em dashes.",
].join("\n");

/**
 * The reading, or null when the model answered with nothing usable. Anything
 * over the length cap counts as a miss the caller falls back from.
 */
function readModelText(result: unknown): string | null {
	const text = aiAnswerText(result);
	return text && text.length <= MAX_READING_CHARS ? text : null;
}

export interface AnalystBrief {
	/** The figures the reading is about, plus how long it is. Cached by this. */
	key: string;
	/** What she is asked to write about them. */
	system: string;
	user: string;
	/** Composed from the same figures when the model is unavailable. */
	fallback: string;
}

export async function analystReading(
	env: Env,
	brief: AnalystBrief,
): Promise<BusinessRiskInsight> {
	if (!env.AI) return { text: brief.fallback, source: "model" };

	const cacheKey = `${CACHE_PREFIX}${brief.key}`;
	const cached = await env.KV.get(cacheKey);
	if (cached) return { text: cached, source: "ai" };

	try {
		const result = await env.AI.run(MODEL, {
			messages: [
				{ role: "system", content: brief.system },
				{ role: "user", content: brief.user },
			],
			max_tokens: MAX_TOKENS,
		});
		const text = readModelText(result);
		if (!text) return { text: brief.fallback, source: "model" };
		await env.KV.put(cacheKey, text, { expirationTtl: CACHE_TTL_SECONDS });
		return { text, source: "ai" };
	} catch (error) {
		// An outage at the provider must not cost the reviewer the reading, so the
		// composed one stands in and the failure is logged rather than swallowed.
		console.error("[eleanor] Workers AI failed", error);
		return { text: brief.fallback, source: "model" };
	}
}

/** "A", "A and B", "A, B and C": a list the way a reader expects to see one. */
export function joinWords(items: string[]): string {
	if (items.length === 0) return "";
	if (items.length === 1) return items[0];
	return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
