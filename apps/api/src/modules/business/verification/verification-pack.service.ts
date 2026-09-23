// The company's verification pack: what it has filed, what is still missing, and the details it confirmed.

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
import { iso } from "../../../lib/format";
import * as repository from "./verification.repository";

/** How many clearer scans the company may file before a person takes over. */
export const RESCAN_LIMIT = 3;

export function isCompanyDocumentSlot(
	value: unknown,
): value is CompanyDocumentSlot {
	return (
		typeof value === "string" &&
		(companyDocumentSlots as readonly string[]).includes(value)
	);
}

// What the account still has to file before the pack can be submitted.
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
		downloadUrl: row ? `/api/business/verification/documents/${slot}` : null,
		scan: row?.scan ?? null,
	};
}

// Both slots come back, empty ones included, so the screen shows what is still missing.
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

// A verified account's details are frozen: its documents were checked against them.
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
