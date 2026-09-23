// The judging half of the scan: the model only reports what the document says, the comparison happens here.

import type { CompanyDocumentScan } from "../../../contracts";
import type { Env } from "../../../env";
import { readDocument, type ScanSubject } from "./document-reader";

/** Letters and digits only, lowercased: what two spellings of a name share. */
function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/\b(pt|cv|ud|tbk|persero|perseroda)\b/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function digitsOf(value: string): string {
	return value.replace(/\D+/g, "");
}

// Either spelling containing the other counts: a deed often writes the name in full where the account uses the short form.
function namesAgree(accountName: string, documentName: string): boolean {
	const account = normalizeName(accountName);
	const document = normalizeName(documentName);
	if (account.length < 3 || document.length < 3) return false;
	return account.includes(document) || document.includes(account);
}

export interface ScanContext {
	subject: ScanSubject;
	fileName: string;
	contentType: string | null;
	/** The account's own record, which the reading is compared against. */
	companyName: string;
	/** The numbers filed on the account; a document stating one of them matches. */
	identityNumbers: Array<{ label: string; value: string }>;
	bytes: ArrayBuffer;
}

// The scan exactly as it is stored and shown: the verdict, the reading behind it, and the company's sentence.
export async function scanCompanyDocument(
	env: Env,
	context: ScanContext,
): Promise<CompanyDocumentScan> {
	const at = new Date().toISOString();
	const outcome = await readDocument(env, context);
	if (outcome.outcome === "unreadable") return unreadable(at, outcome.note);

	const { reading, excerpt, model } = outcome;
	const base = {
		documentType: reading.documentType,
		companyName: reading.companyName,
		registrationNumber: reading.registrationNumber,
		model,
		at,
	};

	// The name is the identity check: a certificate that names another company is not this company's.
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

	// A number the document states has to be one filed on the account.
	const stated = candidateNumbers(
		`${reading.registrationNumber ?? ""}\n${excerpt}`,
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

// NIB is 13 digits and NPWP 15 or 16, both written with dots and dashes that are stripped here.
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
