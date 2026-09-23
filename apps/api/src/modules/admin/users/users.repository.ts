import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	auditLogs,
	companyDocuments,
	type userRoles,
	users,
	vendors,
} from "../../../db/schema";

/** Users (with their vendor profile flag), optionally filtered by role. */
export async function listUsers(
	db: GreenShiftDb,
	role: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			user: users,
			vendorId: vendors.id,
			vendorServiceCategory: vendors.serviceCategory,
		})
		.from(users)
		.leftJoin(vendors, eq(vendors.userId, users.id))
		.$dynamic();
	if (role) {
		query.where(eq(users.role, role as (typeof userRoles)[number]));
	}
	query.orderBy(desc(users.id)).limit(limit);
	const rows = await query;
	return rows;
}

export async function findUserForVerification(db: GreenShiftDb, id: number) {
	const [user] = await db
		.select({ id: users.id, role: users.role, verifiedAt: users.verifiedAt })
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	return user;
}

/**
 * The account as an administrator reviews it, with the pack the company filed:
 * the identity numbers, the certificates and when they were filed.
 */
export async function findUserWithDocuments(db: GreenShiftDb, id: number) {
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!user) return null;

	const documents = await db
		.select()
		.from(companyDocuments)
		.where(eq(companyDocuments.userId, id))
		.orderBy(companyDocuments.slot);

	return { user, documents };
}

/** Sets `verifiedAt` and records the audit entry in one batch. */
export async function applyUserVerification(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		from: string | null;
		rejectionReason?: string | null;
	},
): Promise<void> {
	await db.batch([
		db
			.update(users)
			.set({
				verifiedAt: input.verified ? new Date() : null,
				// The state is what every request is gated on, so the verdict writes it: an
				// administrator's decision opens (or closes) the platform like the scan's.
				verificationState: input.verified ? "VERIFIED" : "REJECTED",
				// A turn-down carries its reason, which the company reads and corrects; verifying
				// clears it.
				verificationRejectionReason: input.verified
					? null
					: (input.rejectionReason ?? null),
			})
			.where(eq(users.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "user.verified",
			entityType: "user",
			entityId: input.id,
			metadata: {
				from: input.from,
				to: input.verified ? "verified" : null,
				...(input.verified ? {} : { reason: input.rejectionReason ?? null }),
			},
		}),
	]);
}
