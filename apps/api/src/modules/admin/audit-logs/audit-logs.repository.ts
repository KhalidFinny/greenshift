import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users } from "../../../db/schema";

/** Audit trail entries with the acting user's email, newest first. */
export async function listAuditLogs(db: GreenShiftDb, limit: number) {
	const rows = await db
		.select({ log: auditLogs, userEmail: users.email })
		.from(auditLogs)
		.leftJoin(users, eq(auditLogs.userId, users.id))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
	return rows;
}
