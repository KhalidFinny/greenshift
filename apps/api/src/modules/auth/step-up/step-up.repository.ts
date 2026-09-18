import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users } from "../../../db/schema";

export interface UserCredentials {
	id: number;
	hashedPassword: string | null;
}

export interface AuditLogEntry {
	userId: number;
	action: string;
	entityType: string;
	entityId: number;
	metadata: { elevatedUntil: string };
}

export async function findCredentialsById(
	db: GreenShiftDb,
	userId: number,
): Promise<UserCredentials | undefined> {
	const [user] = await db
		.select({ id: users.id, hashedPassword: users.hashedPassword })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return user;
}

export async function insertAuditLog(
	db: GreenShiftDb,
	entry: AuditLogEntry,
): Promise<void> {
	await db.insert(auditLogs).values(entry);
}
