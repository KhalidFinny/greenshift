import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { notifications } from "../../../db/schema";

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

// Marks every notification of one account read, so a read feed clears in one move.
// Answers with the number of rows changed, 0 when there was nothing unread.
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
