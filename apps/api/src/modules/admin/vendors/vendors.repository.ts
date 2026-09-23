import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users, vendors } from "../../../db/schema";

/** Vendor profiles with their owning user, newest first. */
export async function listVendors(db: GreenShiftDb, limit: number) {
	return db
		.select({
			vendor: vendors,
			user: users,
		})
		.from(vendors)
		.innerJoin(users, eq(vendors.userId, users.id))
		.orderBy(desc(vendors.createdAt))
		.limit(limit);
}

/** The profile as the certification guard reads it: the pack a verdict is about. */
export async function findVendorForVerification(db: GreenShiftDb, id: number) {
	const [vendor] = await db
		.select({
			id: vendors.id,
			verifiedAt: vendors.verifiedAt,
			npwp: vendors.npwp,
			tdp: vendors.tdp,
			certifications: vendors.certifications,
			certificateKey: vendors.certificateKey,
		})
		.from(vendors)
		.where(eq(vendors.id, id))
		.limit(1);
	return vendor;
}

/** Sets the certification timestamp and records the audit entry in one batch. */
export async function applyVendorVerification(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		from: string | null;
		rejectionReason: string | null;
	},
): Promise<void> {
	await db.batch([
		db
			.update(vendors)
			.set({
				verifiedAt: input.verified ? new Date() : null,
				verificationRejectionReason: input.verified
					? null
					: input.rejectionReason,
			})
			.where(eq(vendors.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "vendor.verified",
			entityType: "vendor_profile",
			entityId: input.id,
			metadata: {
				from: input.from,
				to: input.verified ? "verified" : null,
				rejectionReason: input.verified ? null : input.rejectionReason,
			},
		}),
	]);
}
