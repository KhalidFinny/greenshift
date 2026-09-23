import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { notifications } from "../../../db/schema";

/** Notifications of one user, newest first (§38). */
export function listNotifications(
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

/** Owner-scoped read receipt; returns false when the row does not exist. */
export async function markNotificationRead(
	db: GreenShiftDb,
	id: number,
	userId: number,
): Promise<boolean> {
	const [updated] = await db
		.update(notifications)
		.set({ read: true })
		.where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
		.returning({ id: notifications.id });
	return updated !== undefined;
}

/**
 * Mark every notification of one account read, so a feed that has been read can
 * be cleared in one move rather than one row at a time. Answers with how many
 * rows it changed, which is 0 when there was nothing unread.
 */
export async function markAllNotificationsRead(
	db: GreenShiftDb,
	userId: number,
): Promise<number> {
	const rows = await db
		.update(notifications)
		.set({ read: true })
		.where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
		.returning({ id: notifications.id });

	return rows.length;
}
