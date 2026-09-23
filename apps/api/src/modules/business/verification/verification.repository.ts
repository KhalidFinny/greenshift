import { and, eq } from "drizzle-orm";
import type {
	CompanyDocumentScan,
	CompanyDocumentSlot,
	CompanyVerificationStatus,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { companyDocuments, users } from "../../../db/schema";

/** The account row the verification step reads and writes. */
export async function findAccount(db: GreenShiftDb, userId: number) {
	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return row ?? null;
}

/** The certificates the company has filed, in slot order. */
export async function listCompanyDocuments(db: GreenShiftDb, userId: number) {
	return db
		.select()
		.from(companyDocuments)
		.where(eq(companyDocuments.userId, userId))
		.orderBy(companyDocuments.slot);
}

export async function findCompanyDocument(
	db: GreenShiftDb,
	userId: number,
	slot: CompanyDocumentSlot,
) {
	const [row] = await db
		.select()
		.from(companyDocuments)
		.where(
			and(eq(companyDocuments.userId, userId), eq(companyDocuments.slot, slot)),
		)
		.limit(1);

	return row ?? null;
}

/** The details the company confirmed, and the identity it filed with them. */
export async function saveCompanyDetails(
	db: GreenShiftDb,
	userId: number,
	values: {
		companyName: string;
		industrySector: string;
		address: string;
		phone: string | null;
		nib: string;
		npwp: string;
	},
) {
	const [row] = await db
		.update(users)
		.set(values)
		.where(eq(users.id, userId))
		.returning();

	return row ?? null;
}

/**
 * Files one certificate. The slot is unique per account, so a re-upload
 * replaces the file it supersedes and answers with the row it replaced, whose
 * object the caller then removes.
 */
export async function upsertCompanyDocument(
	db: GreenShiftDb,
	values: {
		userId: number;
		slot: CompanyDocumentSlot;
		fileName: string;
		fileKey: string;
		contentType: string | null;
		sizeBytes: number | null;
	},
) {
	const previous = await findCompanyDocument(db, values.userId, values.slot);

	const [row] = await db
		.insert(companyDocuments)
		.values(values)
		.onConflictDoUpdate({
			target: [companyDocuments.userId, companyDocuments.slot],
			set: {
				fileName: values.fileName,
				fileKey: values.fileKey,
				contentType: values.contentType,
				sizeBytes: values.sizeBytes,
				uploadedAt: new Date(),
			},
		})
		.returning();

	return { row, previous };
}

export async function deleteCompanyDocument(
	db: GreenShiftDb,
	userId: number,
	slot: CompanyDocumentSlot,
) {
	const [row] = await db
		.delete(companyDocuments)
		.where(
			and(eq(companyDocuments.userId, userId), eq(companyDocuments.slot, slot)),
		)
		.returning();

	return row ?? null;
}

/** Puts the account in front of the scan, with the filing timestamp. */
export async function markVerificationSubmitted(
	db: GreenShiftDb,
	userId: number,
	submittedAt: Date,
) {
	const [row] = await db
		.update(users)
		.set({
			legalDocsSubmittedAt: submittedAt,
			// A fresh filing clears the previous verdict: the account is waiting on
			// a new reading, not still turned down by the old one.
			verificationRejectionReason: null,
		})
		.where(eq(users.id, userId))
		.returning();

	return row ?? null;
}

/** Stores what the scan read off one certificate, with the document it read. */
export async function saveDocumentScan(
	db: GreenShiftDb,
	userId: number,
	slot: CompanyDocumentSlot,
	scan: CompanyDocumentScan,
) {
	await db
		.update(companyDocuments)
		.set({ scan })
		.where(
			and(eq(companyDocuments.userId, userId), eq(companyDocuments.slot, slot)),
		);
}

/**
 * The verdict, written where the gate reads it. `verified` is the dated fact an
 * administrator or the scan established; the state is what every request is
 * decided on, so the two are written together.
 */
export async function setVerificationState(
	db: GreenShiftDb,
	userId: number,
	values: {
		state: CompanyVerificationStatus;
		verified?: boolean;
		rejectionReason?: string | null;
		scanAttempts?: number;
	},
) {
	const [row] = await db
		.update(users)
		.set({
			verificationState: values.state,
			...(values.verified === undefined
				? {}
				: { verifiedAt: values.verified ? new Date() : null }),
			...(values.rejectionReason === undefined
				? {}
				: { verificationRejectionReason: values.rejectionReason }),
			...(values.scanAttempts === undefined
				? {}
				: { verificationScanAttempts: values.scanAttempts }),
		})
		.where(eq(users.id, userId))
		.returning();

	return row ?? null;
}
