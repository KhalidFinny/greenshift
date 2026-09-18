import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { users } from "../../../db/schema";

export type UserRow = typeof users.$inferSelect;

export async function findUserByEmail(
	db: GreenShiftDb,
	email: string,
): Promise<UserRow | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return user;
}

export async function updatePasswordHash(
	db: GreenShiftDb,
	userId: number,
	hashedPassword: string,
): Promise<void> {
	await db.update(users).set({ hashedPassword }).where(eq(users.id, userId));
}
