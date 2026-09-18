import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { toNotification } from "../broker.shared";
import {
	listNotifications,
	markNotificationRead,
} from "./notifications.repository";

const factory = createFactory<ApiEnv>();

export const notificationRoutes = new Hono<ApiEnv>();

// ── notifications (§38) ───────────────────────────────────
notificationRoutes.get(
	"/notifications",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listNotifications(db, c.get("user").id, limit);

		return c.json({ notifications: rows.map(toNotification) });
	}),
);

// Mark one notification read (owner-scoped, idempotent).
notificationRoutes.patch(
	"/notifications/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const updated = await markNotificationRead(db, id, c.get("user").id);

		if (!updated) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Notification not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
