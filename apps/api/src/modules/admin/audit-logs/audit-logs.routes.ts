import { Hono } from "hono";
import type { AuditLogEntry } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { iso, parseLimit } from "../../../lib/format";
import { factory } from "../admin.shared";
import { listAuditLogs } from "./audit-logs.repository";

export const auditLogRoutes = new Hono<ApiEnv>();

auditLogRoutes.get(
	"/audit-logs",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listAuditLogs(db, limit);

		const list: AuditLogEntry[] = rows.map(({ log, userEmail }) => ({
			id: log.id,
			action: log.action,
			entityType: log.entityType,
			entityId: log.entityId,
			metadata: log.metadata,
			createdAt: iso(log.createdAt),
			userEmail,
		}));
		return c.json({ logs: list });
	}),
);
