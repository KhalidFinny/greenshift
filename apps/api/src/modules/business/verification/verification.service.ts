/* The company's own verification: the gate the whole business surface sits
 * behind.
 *
 * A company account files the pack an administrator checks it against (its
 * details, its legal identity numbers, and the two certificates behind them) and
 * then submits the filing. Until an administrator verifies the account, the
 * platform's business endpoints answer COMPANY_NOT_VERIFIED: the only work an
 * unverified company can do is the work that gets it verified.
 *
 * The platform cannot check a registry itself, so what it can do is require the
 * documents that let a person check, and keep the state machine honest: nothing
 * is submitted until both certificates and both numbers are on file.
 */

import type {
	CompanyDocument,
	CompanyDocumentScan,
	CompanyVerification,
	CompanyVerificationBody,
} from "../../../contracts";
import {
	type CompanyDocumentSlot,
	companyDocumentLabels,
	companyDocumentSlots,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import {
	isAcceptedDocument,
	MAX_DOCUMENT_BYTES,
} from "../../../lib/document-upload";
import { iso } from "../../../lib/format";
import { insertNotification } from "../notifications/notifications.repository";
import { scanCompanyDocument } from "./document-scan.service";
import * as repository from "./verification.repository";

export function isCompanyDocumentSlot(
	value: unknown,
): value is CompanyDocumentSlot {
	return (
		typeof value === "string" &&
		(companyDocumentSlots as readonly string[]).includes(value)
	);
}

/** What the account still has to file before the pack can be submitted. */
function missingItems(verification: {
	nib: string | null;
	npwp: string | null;
	filed: Set<string>;
}): string[] {
	const missing: string[] = [];
	if (!verification.nib) missing.push("Business identification number (NIB)");
	if (!verification.npwp) missing.push("Tax identification number (NPWP)");
	for (const slot of companyDocumentSlots) {
		if (!verification.filed.has(slot))
			missing.push(companyDocumentLabels[slot]);
	}
	return missing;
}

function toDocument(
	slot: CompanyDocumentSlot,
	row:
		| {
				fileName: string;
				sizeBytes: number | null;
				uploadedAt: Date;
				scan: CompanyDocumentScan | null;
		  }
		| undefined,
): CompanyDocument {
	return {
		slot,
		label: companyDocumentLabels[slot],
		fileName: row?.fileName ?? null,
		sizeBytes: row?.sizeBytes ?? null,
		uploadedAt: row ? iso(row.uploadedAt) : null,
		// Served back through the account's own download route: a URL rather than
		// a key, because the caller only ever opens it.
		downloadUrl: row ? `/api/business/verification/documents/${slot}` : null,
		scan: row?.scan ?? null,
	};
}

/**
 * The account's verification as the company reads it: its details as they are on
 * file, the identity it filed, both certificate slots (empty ones included, so
 * the screen can show what is still missing) and the verdict if there is one.
 */
export async function readCompanyVerification(
	db: GreenShiftDb,
	userId: number,
): Promise<CompanyVerification | null> {
	const account = await repository.findAccount(db, userId);
	if (!account) return null;

	const rows = await repository.listCompanyDocuments(db, userId);
	const bySlot = new Map(rows.map((row) => [row.slot, row]));
	const filed = new Set(rows.map((row) => row.slot));

	return {
		status: account.verificationState,
		companyName: account.companyName,
		industrySector: account.industrySector,
		address: account.address,
		representative: account.name,
		contactEmail: account.email,
		contactPhone: account.phone,
		nib: account.nib,
		npwp: account.npwp,
		submittedAt: iso(account.legalDocsSubmittedAt),
		verifiedAt: iso(account.verifiedAt),
		rejectionReason: account.verificationRejectionReason,
		documents: companyDocumentSlots.map((slot) =>
			toDocument(slot, bySlot.get(slot)),
		),
		missing: missingItems({
			nib: account.nib,
			npwp: account.npwp,
			filed,
		}),
		rescansLeft: Math.max(0, RESCAN_LIMIT - account.verificationScanAttempts),
	};
}

export type SaveDetailsResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" };

/**
 * Saves the details the company confirmed. A verified account is not editable
 * here: the documents were checked against the record as it stood, so changing
 * it would leave the verdict describing something else.
 */
export async function saveCompanyDetails(
	db: GreenShiftDb,
	userId: number,
	body: CompanyVerificationBody,
): Promise<SaveDetailsResult> {
	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verifiedAt !== null) return { status: "verified" };

	await repository.saveCompanyDetails(db, userId, {
		companyName: body.companyName,
		industrySector: body.industrySector,
		address: body.address,
		phone: body.contactPhone.trim() ? body.contactPhone.trim() : null,
		nib: body.nib,
		npwp: body.npwp,
	});

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

export type AttachDocumentResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" }
	| { status: "too_large" }
	| { status: "unsupported" }
	| { status: "bad_slot" };

/**
 * Files one certificate. The row is written first and the object after it, so a
 * failed write leaves the previous certificate in place rather than a key
 * pointing at nothing.
 */
export async function attachCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
	file: File,
): Promise<AttachDocumentResult> {
	if (!isCompanyDocumentSlot(slot)) return { status: "bad_slot" };

	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verifiedAt !== null) return { status: "verified" };

	if (file.size > MAX_DOCUMENT_BYTES) return { status: "too_large" };
	if (!isAcceptedDocument(file)) return { status: "unsupported" };

	const fileKey = `company-documents/${userId}/${slot}/${file.name}`;
	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || "application/octet-stream" },
	});

	const { row, previous } = await repository.upsertCompanyDocument(db, {
		userId,
		slot,
		fileName: file.name,
		fileKey,
		contentType: file.type || null,
		sizeBytes: file.size,
	});
	if (!row) {
		await env.R2.delete(fileKey);
		return { status: "not_found" };
	}

	// Replacing a certificate leaves the old object behind otherwise.
	if (previous && previous.fileKey !== fileKey) {
		await env.R2.delete(previous.fileKey);
	}

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

export type RemoveDocumentResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" };

export async function removeCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
): Promise<RemoveDocumentResult> {
	if (!isCompanyDocumentSlot(slot)) return { status: "not_found" };

	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verifiedAt !== null) return { status: "verified" };

	const removed = await repository.deleteCompanyDocument(db, userId, slot);
	if (!removed) return { status: "not_found" };
	await env.R2.delete(removed.fileKey);

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

/** How many clearer scans the company may file before a person takes over. */
export const RESCAN_LIMIT = 3;

export type SubmitVerificationResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" }
	| { status: "incomplete"; missing: string[] };

/**
 * Files the account and scans its pack. This is where the verdict comes from:
 *
 * - every certificate reads as the document it claims to be, naming this
 *   company, with the numbers filed on the account → the account verifies
 *   itself, with no one in the loop;
 * - a certificate reads as something else, or names another company → the
 *   account is turned down with the reading that says why, and the company
 *   corrects the file;
 * - a certificate cannot be read → the company is asked for a clearer scan,
 *   up to `RESCAN_LIMIT` times, after which the account goes to an
 *   administrator, who decides with the same reading in front of them.
 *
 * The pack has to be complete before any of this: there is nothing to scan
 * otherwise.
 */
export async function submitCompanyVerification(
	db: GreenShiftDb,
	env: Env,
	userId: number,
): Promise<SubmitVerificationResult> {
	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verificationState === "VERIFIED") return { status: "verified" };

	const before = await readCompanyVerification(db, userId);
	if (!before) return { status: "not_found" };
	if (before.missing.length > 0) {
		return { status: "incomplete", missing: before.missing };
	}

	const submittedAt = new Date();
	await repository.markVerificationSubmitted(db, userId, submittedAt);

	// The scan runs over the filed files, one at a time: each verdict is stored
	// with the document it read, so the company and the reviewer both see what
	// the reading was.
	const rows = await repository.listCompanyDocuments(db, userId);
	const scans: Array<{ slot: CompanyDocumentSlot; scan: CompanyDocumentScan }> =
		[];
	for (const row of rows) {
		if (!isCompanyDocumentSlot(row.slot)) continue;
		const object = await env.R2.get(row.fileKey);
		if (!object) {
			scans.push({
				slot: row.slot,
				scan: {
					verdict: "UNREADABLE",
					documentType: null,
					companyName: null,
					registrationNumber: null,
					note: "The filed file could not be opened. File the certificate again.",
					model: null,
					at: submittedAt.toISOString(),
				},
			});
			continue;
		}
		const scan = await scanCompanyDocument(env, {
			subject: row.slot,
			fileName: row.fileName,
			contentType: row.contentType,
			companyName: account.companyName ?? "",
			identityNumbers: [
				{ label: "NIB", value: account.nib ?? "" },
				{ label: "NPWP", value: account.npwp ?? "" },
			],
			bytes: await object.arrayBuffer(),
		});
		await repository.saveDocumentScan(db, userId, row.slot, scan);
		scans.push({ slot: row.slot, scan });
	}

	const mismatched = scans.filter((entry) => entry.scan.verdict === "MISMATCH");
	const unreadableScans = scans.filter(
		(entry) => entry.scan.verdict === "UNREADABLE",
	);

	if (mismatched.length > 0) {
		const reason = mismatched
			.map(
				(entry) => `${companyDocumentLabels[entry.slot]}: ${entry.scan.note}`,
			)
			.join(" ");
		await repository.setVerificationState(db, userId, {
			state: "REJECTED",
			rejectionReason: reason,
		});
		await insertNotification(db, {
			userId,
			type: "verification",
			title: "Company verification could not be confirmed",
			body: reason,
			link: "/business/verification",
		});
	} else if (unreadableScans.length > 0) {
		const attempts = account.verificationScanAttempts + 1;
		const reason = unreadableScans
			.map(
				(entry) => `${companyDocumentLabels[entry.slot]}: ${entry.scan.note}`,
			)
			.join(" ");
		if (attempts >= RESCAN_LIMIT) {
			// Out of rescans: a person reads it, with the readings in front of them.
			await repository.setVerificationState(db, userId, {
				state: "PENDING",
				scanAttempts: attempts,
			});
			await insertNotification(db, {
				userId,
				type: "verification",
				title: "Company verification is with an administrator",
				body: "The documents could not be read automatically, so an administrator will review them. Nothing else is needed from you for now.",
				link: "/business/verification",
			});
		} else {
			await repository.setVerificationState(db, userId, {
				state: "NEEDS_RESCAN",
				scanAttempts: attempts,
			});
			await insertNotification(db, {
				userId,
				type: "verification",
				title: "A clearer scan is needed",
				body: reason,
				link: "/business/verification",
			});
		}
	} else {
		// Every certificate read as the document it claims to be, naming this
		// company: the account verifies itself.
		await repository.setVerificationState(db, userId, {
			state: "VERIFIED",
			verified: true,
		});
		await insertNotification(db, {
			userId,
			type: "verification",
			title: "Company verified",
			body: `Both certificates were read and match your company details. The platform is open to you.`,
			link: "/business",
		});
	}

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

export type CompanyDocumentStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" };

/** One filed certificate, ready to stream. The account reads its own. */
export async function readCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
): Promise<CompanyDocumentStream> {
	if (!isCompanyDocumentSlot(slot)) return { outcome: "not_found" };

	const row = await repository.findCompanyDocument(db, userId, slot);
	if (!row) return { outcome: "not_found" };

	const object = await env.R2.get(row.fileKey);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType:
			object.httpMetadata?.contentType ??
			row.contentType ??
			"application/octet-stream",
		fileName: row.fileName,
	};
}

/**
 * The same certificate as an administrator reads it, when reviewing an account.
 * Scoped to the account being reviewed, so the reviewer reads exactly the file
 * the company filed against that account.
 */
export async function readCompanyDocumentForAdmin(
	db: GreenShiftDb,
	env: Env,
	accountId: number,
	slot: string,
): Promise<CompanyDocumentStream> {
	return readCompanyDocument(db, env, accountId, slot);
}
