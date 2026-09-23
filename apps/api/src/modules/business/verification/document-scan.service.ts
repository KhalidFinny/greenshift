/* The document scan: what makes a filed certificate readable by the platform.
 *
 * The model only reports what the document says (its type, the company name and
 * any registration number). The comparison against the account happens here, in
 * code, so every verdict traces to words the document contains. It does not
 * prove the entity exists; only the registry can say that.
 */

import type {
	CompanyDocumentScan,
	CompanyDocumentSlot,
} from "../../../contracts";
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
interface ScanReading {
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
	// The model is asked for JSON alone, but a stray sentence around it is not a
	// reason to lose the reading.
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

/** Letters and digits only, lowercased: what two spellings of a name share. */
function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/\b(pt|cv|ud|tbk|persero|perseroda)\b/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/** Digits only: NIB and NPWP are written with dots, dashes and spaces. */
function digitsOf(value: string): string {
	return value.replace(/\D+/g, "");
}

/**
 * Whether the name on the document is the name on the account. Compared
 * normalized, and either spelling containing the other counts: a deed often
 * writes the name in full where the account uses the short form, and the point
 * is whether the document is about this company, not how it is punctuated.
 */
function namesAgree(accountName: string, documentName: string): boolean {
	const account = normalizeName(accountName);
	const document = normalizeName(documentName);
	if (account.length < 3 || document.length < 3) return false;
	return account.includes(document) || document.includes(account);
}

export interface ScanContext {
	subject: ScanSubject;
	fileName: string;
	/** The MIME type the file was filed with: the converter requires one. */
	contentType: string | null;
	/** The account's own record, which the reading is compared against. */
	companyName: string;
	/** The numbers filed on the account; a document stating one of them matches. */
	identityNumbers: Array<{ label: string; value: string }>;
	bytes: ArrayBuffer;
}

/**
 * One certificate, read and judged. Returns the scan exactly as it is stored and
 * shown: the verdict, the reading behind it, and the sentence the company reads.
 */
export async function scanCompanyDocument(
	env: Env,
	context: ScanContext,
): Promise<CompanyDocumentScan> {
	const at = new Date().toISOString();
	if (!env.AI) {
		return {
			verdict: "UNREADABLE",
			documentType: null,
			companyName: null,
			registrationNumber: null,
			note: "The document reader is not available, so an administrator will read this certificate instead.",
			model: null,
			at,
		};
	}

	let text: string;
	try {
		const converted = await env.AI.toMarkdown({
			name: context.fileName,
			// The converter reads the MIME type off the blob, and rejects an empty
			// one: a file stored without a type is offered as a PDF, which is what
			// the certificate is.
			blob: new Blob([context.bytes], {
				type: context.contentType ?? "application/pdf",
			}),
		});
		if (converted.format === "error") {
			return unreadable(at, "The file could not be read as a document.");
		}
		text = converted.data.trim();
	} catch (error) {
		// A provider outage is not the company's fault, so it reads as a rescan
		// rather than as a rejection.
		console.error("[scan] document conversion failed", error);
		return unreadable(at, "The document reader did not answer. Try again.");
	}

	if (text.length < MIN_DOCUMENT_CHARS) {
		return unreadable(
			at,
			"The file has almost no readable text in it. A scan of the signed document, or the PDF it was issued as, reads better than a photo of a screen.",
		);
	}

	let reading: ScanReading | null;
	try {
		const result = await env.AI.run(SCAN_MODEL, {
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "user",
					content: `${subjectQuestion(context.subject)}\n\n---\n${text.slice(0, MAX_PROMPT_CHARS)}`,
				},
			],
			max_tokens: 300,
		});
		reading = readJsonAnswer(result);
	} catch (error) {
		console.error("[scan] reading failed", error);
		return unreadable(at, "The document reader did not answer. Try again.");
	}

	if (!reading || !reading.readable) {
		return unreadable(
			at,
			"The document could not be read. File the certificate itself, as the PDF or scan it was issued as.",
		);
	}

	const base = {
		documentType: reading.documentType,
		companyName: reading.companyName,
		registrationNumber: reading.registrationNumber,
		model: SCAN_MODEL,
		at,
	};

	// The name is the identity check: a certificate that names another company is
	// not this company's certificate, whatever else it says.
	if (!reading.companyName) {
		return {
			...base,
			verdict: "UNREADABLE",
			note: "The document does not state a company name this reader could find. File the page that names the company.",
		};
	}
	if (!namesAgree(context.companyName, reading.companyName)) {
		return {
			...base,
			verdict: "MISMATCH",
			note: `The document names "${reading.companyName}", which is not the company on this account ("${context.companyName}").`,
		};
	}

	// The numbers, when the document states one, have to be the ones filed: a
	// certificate carrying another company's NIB is the clearest kind of mismatch.
	const stated = candidateNumbers(
		`${reading.registrationNumber ?? ""}\n${text.slice(0, MAX_PROMPT_CHARS)}`,
	);
	const filed = context.identityNumbers
		.map((entry) => ({ ...entry, digits: digitsOf(entry.value) }))
		.filter((entry) => entry.digits.length > 0);
	const matched = filed.find((entry) => stated.includes(entry.digits));
	if (!matched && stated.length > 0) {
		return {
			...base,
			verdict: "MISMATCH",
			note: `The document states the number ${stated[0]}, which is not ${listOf(filed.map((entry) => entry.label))} filed on this account.`,
		};
	}

	return {
		...base,
		verdict: "PASSED",
		note: matched
			? `Read as ${reading.documentType ?? "a legal document"} naming ${reading.companyName}, carrying the ${matched.label} filed on this account.`
			: `Read as ${reading.documentType ?? "a legal document"} naming ${reading.companyName}, which matches this account. The document states no registration number to check.`,
	};
}

/** "the NIB", "the NIB or NPWP", "the NIB, NPWP or TDP". */
function listOf(labels: string[]): string {
	if (labels.length === 0) return "the numbers";
	if (labels.length === 1) return `the ${labels[0]}`;
	return `the ${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

/**
 * The registration-shaped numbers a text states: NIB is 13 digits, NPWP is 15
 * or 16, and both are written with dots and dashes that are stripped here.
 */
function candidateNumbers(text: string): string[] {
	const found = new Set<string>();
	for (const match of text.matchAll(/\d[\d.\-\s]{10,}\d/g)) {
		const digits = digitsOf(match[0]);
		if (digits.length >= 13 && digits.length <= 16) found.add(digits);
	}
	return [...found];
}

function unreadable(at: string, note: string): CompanyDocumentScan {
	return {
		verdict: "UNREADABLE",
		documentType: null,
		companyName: null,
		registrationNumber: null,
		note,
		model: null,
		at,
	};
}
