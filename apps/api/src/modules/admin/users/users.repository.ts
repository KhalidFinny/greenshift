import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, type userRoles, users, vendors } from "../../../db/schema";

/** Users (with their vendor profile flag), optionally filtered by role. */
export async function listUsers(
	db: GreenShiftDb,
	role: string | undefined,
	limit: number,
) {
	const query = db
		.select({ user: users, vendorId: vendors.id })
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

/** Minimal projection used by the verification guard. */
export async function findUserForVerification(db: GreenShiftDb, id: number) {
	const [user] = await db
		.select({ id: users.id, role: users.role, verifiedAt: users.verifiedAt })
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	return user;
}

/** Sets `verifiedAt` and records the audit entry in one batch. */
export async function applyUserVerification(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		from: string | null;
	},
): Promise<void> {
	await db.batch([
		db
			.update(users)
			.set({ verifiedAt: input.verified ? new Date() : null })
			.where(eq(users.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "user.verified",
			entityType: "user",
			entityId: input.id,
			metadata: {
				from: input.from,
				to: input.verified ? "verified" : null,
			},
		}),
	]);
}
