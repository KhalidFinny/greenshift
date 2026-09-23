import { eq } from "drizzle-orm";
import type { CompanyDocumentScan } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users, vendors } from "../../../db/schema";

/**
 * The profile fields a save may carry: an absent key keeps its stored value, so
 * saving the company name cannot clear the legal identity registration wrote.
 */
export interface VendorProfileValues {
	companyName: string;
	description?: string | null;
	serviceCategory?: string | null;
	location?: string | null;
	nib?: string | null;
	npwp?: string | null;
	tdp?: string | null;
	certifications?: string[];
	portfolio?: string[];
}

export async function findVendorProfileRow(db: GreenShiftDb, userId: number) {
	const [row] = await db
		.select({ vendor: vendors, user: users })
		.from(vendors)
		.innerJoin(users, eq(vendors.userId, users.id))
		.where(eq(vendors.userId, userId))
		.limit(1);

	return row;
}

export async function findVendorProfileById(
	db: GreenShiftDb,
	vendorId: number,
) {
	const [row] = await db
		.select({ vendor: vendors, user: users })
		.from(vendors)
		.innerJoin(users, eq(vendors.userId, users.id))
		.where(eq(vendors.id, vendorId))
		.limit(1);

	return row;
}

export async function findVendorIdByUser(db: GreenShiftDb, userId: number) {
	const [existing] = await db
		.select({ id: vendors.id })
		.from(vendors)
		.where(eq(vendors.userId, userId))
		.limit(1);

	return existing;
}

// Atomic upsert: conflicts on the unique user_id index, so two first-time saves
// racing cannot create duplicate profiles. Only the keys the save carried are written.
export async function upsertVendorProfile(
	db: GreenShiftDb,
	userId: number,
	values: VendorProfileValues,
) {
	const [saved] = await db
		.insert(vendors)
		.values({
			userId,
			companyName: values.companyName,
			description: values.description ?? null,
			serviceCategory: values.serviceCategory ?? null,
			location: values.location ?? null,
			nib: values.nib ?? null,
			npwp: values.npwp ?? null,
			tdp: values.tdp ?? null,
			certifications: values.certifications ?? [],
			portfolio: values.portfolio ?? [],
		})
		.onConflictDoUpdate({
			target: vendors.userId,
			set: {
				companyName: values.companyName,
				...(values.description !== undefined
					? { description: values.description }
					: {}),
				...(values.serviceCategory !== undefined
					? { serviceCategory: values.serviceCategory }
					: {}),
				...(values.location !== undefined ? { location: values.location } : {}),
				...(values.nib !== undefined ? { nib: values.nib } : {}),
				...(values.npwp !== undefined ? { npwp: values.npwp } : {}),
				...(values.tdp !== undefined ? { tdp: values.tdp } : {}),
				...(values.certifications !== undefined
					? { certifications: values.certifications }
					: {}),
				...(values.portfolio !== undefined
					? { portfolio: values.portfolio }
					: {}),
			},
		})
		.returning({ id: vendors.id });

	return saved;
}

/** Keeps users.companyName in sync and appends the profile audit entry. */
export async function syncCompanyNameAndRecordAudit(
	db: GreenShiftDb,
	params: {
		userId: number;
		companyName: string;
		action: string;
		vendorId: number;
	},
): Promise<void> {
	await db.batch([
		db
			.update(users)
			.set({ companyName: params.companyName })
			.where(eq(users.id, params.userId)),
		db.insert(auditLogs).values({
			userId: params.userId,
			action: params.action,
			entityType: "vendor_profile",
			entityId: params.vendorId,
			metadata: { companyName: params.companyName },
		}),
	]);
}

/**
 * Stores one filed certificate on the profile. A re-file clears the reason the
 * profile was turned down: that verdict was about the file it replaces.
 */
export async function saveVendorCertificate(
	db: GreenShiftDb,
	vendorId: number,
	input: {
		fileName: string;
		fileKey: string;
		contentType: string | null;
		scan: CompanyDocumentScan | null;
	},
) {
	const [saved] = await db
		.update(vendors)
		.set({
			certificateName: input.fileName,
			certificateKey: input.fileKey,
			certificateScan: input.scan,
			verificationRejectionReason: null,
		})
		.where(eq(vendors.id, vendorId))
		.returning({ id: vendors.id });

	return saved;
}
