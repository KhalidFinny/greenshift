import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users, vendors } from "../../../db/schema";

/**
 * The profile fields a save may carry. Everything past the company name is
 * optional and an absent key keeps its stored value: the registration writes the
 * legal identity, and a later save of the company name from one form must not
 * clear the rest of the profile.
 */
export interface VendorProfileValues {
	companyName: string;
	description?: string | null;
	serviceCategory?: string | null;
	location?: string | null;
	nib?: string | null;
	npwp?: string | null;
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

// Atomic upsert: conflicts on the unique user_id index, so two first-time
// saves racing cannot create duplicate profiles (single statement). On conflict
// only the keys the save carried are written.
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
