import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { users } from "../../../db/schema";

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export async function findUserIdByEmail(
	db: GreenShiftDb,
	email: string,
): Promise<number | undefined> {
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return existing?.id;
}

export async function insertUser(
	db: GreenShiftDb,
	values: NewUser,
): Promise<UserRow> {
	const [user] = await db.insert(users).values(values).returning();
	return user;
}
