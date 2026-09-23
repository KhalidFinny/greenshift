import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorNotification } from "../../../contracts";
import { createDb } from "../../../db";
import type { notifications } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from "./notifications.repository";

const factory = createFactory<ApiEnv>();

export const notificationRoutes = new Hono<ApiEnv>();

function toNotification(
	row: typeof notifications.$inferSelect,
): VendorNotification {
	return {
		id: row.id,
		type: row.type,
		title: row.title,
		body: row.body,
		link: row.link,
		read: row.read,
		createdAt: row.createdAt.toISOString(),
	};
}

// ── notifications ─────────────────────────────────────────
notificationRoutes.get(
	"/notifications",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listNotifications(db, c.get("user").id, limit);
		return c.json({ notifications: rows.map(toNotification) });
	}),
);

notificationRoutes.patch(
	"/notifications/:id",
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const updated = await markNotificationRead(db, id, c.get("user").id);
		if (!updated) {
			return apiNotFound(c, "Notification");
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);

// ── read the whole feed ───────────────────────────────────
// Registered after the `:id` route so the two cannot shadow each other.
notificationRoutes.patch(
	"/notifications",
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const read = await markAllNotificationsRead(db, c.get("user").id);
		return apiSuccess(
			c,
			{ read },
			read === 0 ? "Nothing was unread" : "All notifications marked read",
		);
	}),
);
