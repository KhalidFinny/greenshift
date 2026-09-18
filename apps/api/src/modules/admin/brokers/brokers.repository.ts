import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, brokerProfiles, users } from "../../../db/schema";

/** Broker profiles with their owning user, newest first. */
export async function listBrokers(db: GreenShiftDb, limit: number) {
	return db
		.select({ broker: brokerProfiles, user: users })
		.from(brokerProfiles)
		.innerJoin(users, eq(brokerProfiles.userId, users.id))
		.orderBy(desc(brokerProfiles.createdAt))
		.limit(limit);
}

/** Minimal projection used by the licence-verification guard. */
export async function findBrokerForVerification(db: GreenShiftDb, id: number) {
	const [broker] = await db
		.select({ id: brokerProfiles.id, verifiedAt: brokerProfiles.verifiedAt })
		.from(brokerProfiles)
		.where(eq(brokerProfiles.id, id))
		.limit(1);
	return broker;
}

/** Stores the licence decision and its audit entry in one batch. */
export async function applyBrokerVerification(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		from: string | null;
		rejectionReason: string | null;
		to: string | undefined;
	},
): Promise<void> {
	await db.batch([
		db
			.update(brokerProfiles)
			.set({
				verifiedAt: input.verified ? new Date() : null,
				rejectionReason: input.rejectionReason,
			})
			.where(eq(brokerProfiles.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: input.verified ? "broker.verified" : "broker.rejected",
			entityType: "broker_profile",
			entityId: input.id,
			metadata: {
				from: input.from,
				to: input.to,
			},
		}),
	]);
}
