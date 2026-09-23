// The text an instruct model answered with. Workers AI returns the native shape
// (`response`) for some models and the OpenAI-compatible one for others; both are read.
export function aiAnswerText(result: unknown): string | null {
	if (typeof result !== "object" || result === null) return null;
	if ("response" in result) {
		const native = result.response;
		if (typeof native === "string" && native.trim()) return native.trim();
	}
	if (!("choices" in result)) return null;
	const choices = result.choices;
	if (!Array.isArray(choices)) return null;
	for (const choice of choices) {
		if (typeof choice !== "object" || choice === null) continue;
		if (!("message" in choice)) continue;
		const message = choice.message;
		if (typeof message !== "object" || message === null) continue;
		if (!("content" in message)) continue;
		const content = message.content;
		if (typeof content === "string" && content.trim()) return content.trim();
	}
	return null;
}
