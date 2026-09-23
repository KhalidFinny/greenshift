// The model half of the scan: it reports what the document says, never whether it is genuine.

import type { CompanyDocumentSlot } from "../../../contracts";
import {
	companyDocumentLabels,
	vendorCertificateLabel,
} from "../../../contracts";
import type { Env } from "../../../env";
import { aiAnswerText } from "../../../lib/ai-answer";

/** The reader. Small, fast, and on the free Workers AI allowance. */
const SCAN_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
/** A certificate shorter than this did not convert to anything readable. */
const MIN_DOCUMENT_CHARS = 120;
/** The text handed to the model, so a long document cannot run away with the call. */
const MAX_PROMPT_CHARS = 6000;

const SYSTEM_PROMPT = [
	"You read Indonesian corporate documents for a financing platform.",
	"You are given the text of one document that a company filed as proof of its",
	"legal existence. Report only what the document itself states.",
	"Never guess, never fill a gap with a plausible value, and never judge whether",
	"the document is genuine: another part of the system compares your reading",
	"with the company's own record.",
	"",
	"Answer with one JSON object and nothing else:",
	'{"documentType": "<what the document calls itself, in a few words>",',
	'"companyName": "<the company name the document states, or null>",',
	'"registrationNumber": "<the registration, deed or tax number it states, or null>",',
	'"readable": true|false}',
	'Set "readable" to false when the text is not a document you can read, and use',
	"null for anything the document does not state.",
].join("\n");

/** Which certificate is being read: a company slot, or the vendor's own file. */
export type ScanSubject = CompanyDocumentSlot | "vendor_certificate";

function subjectQuestion(subject: ScanSubject): string {
	return subject === "vendor_certificate"
		? `The vendor says this is its ${vendorCertificateLabel}.`
		: `The company says this is its ${companyDocumentLabels[subject]}.`;
}

/** The model's answer, as read off the JSON it was asked for. */
export interface ScanReading {
	documentType: string | null;
	companyName: string | null;
	registrationNumber: string | null;
	readable: boolean;
}

function readJsonAnswer(result: unknown): ScanReading | null {
	const response = aiAnswerText(result);
	if (response === null) {
		console.error(
			"[scan] answer carried no text",
			JSON.stringify(result).slice(0, 200),
		);
		return null;
	}
	// The model is asked for JSON alone, but a stray sentence around it is no reason to lose the reading.
	const start = response.indexOf("{");
	const end = response.lastIndexOf("}");
	if (start === -1 || end <= start) {
		console.error("[scan] answer was not JSON", response.slice(0, 400));
		return null;
	}
	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(response.slice(start, end + 1)) as Record<
			string,
			unknown
		>;
	} catch (error) {
		console.error("[scan] answer did not parse", response.slice(0, 400), error);
		return null;
	}
	const text = (value: unknown): string | null =>
		typeof value === "string" && value.trim() ? value.trim() : null;
	return {
		documentType: text(parsed.documentType),
		companyName: text(parsed.companyName),
		registrationNumber: text(parsed.registrationNumber),
		readable: parsed.readable !== false,
	};
}

export interface ReadingRequest {
	subject: ScanSubject;
	fileName: string;
	/** The converter rejects an empty MIME type, so a file stored without one is offered as a PDF. */
	contentType: string | null;
	bytes: ArrayBuffer;
}

export type ReadingOutcome =
	| { outcome: "read"; reading: ScanReading; excerpt: string; model: string }
	| { outcome: "unreadable"; note: string };

export async function readDocument(
	env: Env,
	request: ReadingRequest,
): Promise<ReadingOutcome> {
	if (!env.AI) {
		return {
			outcome: "unreadable",
			note: "The document reader is not available, so an administrator will read this certificate instead.",
		};
	}

	let text: string;
	try {
		const converted = await env.AI.toMarkdown({
			name: request.fileName,
			blob: new Blob([request.bytes], {
				type: request.contentType ?? "application/pdf",
			}),
		});
		if (converted.format === "error") {
			return {
				outcome: "unreadable",
				note: "The file could not be read as a document.",
			};
		}
		text = converted.data.trim();
	} catch (error) {
		// A provider outage is not the company's fault, so it reads as a rescan rather than a rejection.
		console.error("[scan] document conversion failed", error);
		return {
			outcome: "unreadable",
			note: "The document reader did not answer. Try again.",
		};
	}

	if (text.length < MIN_DOCUMENT_CHARS) {
		return {
			outcome: "unreadable",
			note: "The file has almost no readable text in it. A scan of the signed document, or the PDF it was issued as, reads better than a photo of a screen.",
		};
	}

	const excerpt = text.slice(0, MAX_PROMPT_CHARS);
	let reading: ScanReading | null;
	try {
		const result = await env.AI.run(SCAN_MODEL, {
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "user",
					content: `${subjectQuestion(request.subject)}\n\n---\n${excerpt}`,
				},
			],
			max_tokens: 300,
		});
		reading = readJsonAnswer(result);
	} catch (error) {
		console.error("[scan] reading failed", error);
		return {
			outcome: "unreadable",
			note: "The document reader did not answer. Try again.",
		};
	}

	if (!reading || !reading.readable) {
		return {
			outcome: "unreadable",
			note: "The document could not be read. File the certificate itself, as the PDF or scan it was issued as.",
		};
	}

	return { outcome: "read", reading, excerpt, model: SCAN_MODEL };
}
