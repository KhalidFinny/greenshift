import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users, vendors } from "../../../db/schema";

/** The validated, normalized profile fields written by the upsert. */
export interface VendorProfileValues {
	companyName: string;
	description: string | null;
	certifications: string[];
	portfolio: string[];
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
// saves racing cannot create duplicate profiles (single statement).
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
			description: values.description,
			certifications: values.certifications,
			portfolio: values.portfolio,
		})
		.onConflictDoUpdate({
			target: vendors.userId,
			set: {
				companyName: values.companyName,
				description: values.description,
				certifications: values.certifications,
				portfolio: values.portfolio,
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
