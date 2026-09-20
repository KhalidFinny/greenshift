import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { notifications } from "../../../db/schema";

/** One notification for one user, written where the event happens. */
export async function insertNotification(
	db: GreenShiftDb,
	entry: {
		userId: number;
		type: string;
		title: string;
		body: string;
		link: string;
	},
): Promise<void> {
	await db.insert(notifications).values(entry);
}

export async function listNotifications(
	db: GreenShiftDb,
	userId: number,
	limit: number,
) {
	return db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(limit);
}

// Mark one notification read (owner-scoped, idempotent).
export async function markNotificationRead(
	db: GreenShiftDb,
	id: number,
	userId: number,
) {
	const [updated] = await db
		.update(notifications)
		.set({ read: true })
		.where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
		.returning({ id: notifications.id });

	return updated;
}
