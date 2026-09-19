import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users } from "../../../db/schema";

/** The signed-in account's own row, scoped to what the picture endpoints need. */
export interface AccountRow {
	id: number;
	avatar: string | null;
}

export async function findAccount(
	db: GreenShiftDb,
	userId: number,
): Promise<AccountRow | undefined> {
	const [row] = await db
		.select({ id: users.id, avatar: users.avatar })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return row;
}

/**
 * Points the account at a new picture key, or clears it with `null`, and records
 * the change in the audit trail in the same batch.
 */
export async function setAvatarKey(
	db: GreenShiftDb,
	userId: number,
	key: string | null,
): Promise<void> {
	await db.batch([
		db.update(users).set({ avatar: key }).where(eq(users.id, userId)),
		db.insert(auditLogs).values({
			userId,
			action: key ? "account.avatar_set" : "account.avatar_cleared",
			entityType: "user",
			entityId: userId,
			metadata: { avatar: key },
		}),
	]);
}
