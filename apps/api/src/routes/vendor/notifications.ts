import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorNotification } from "../../contracts";
import { createDb } from "../../db";
import { notifications } from "../../db/schema";
import type { ApiEnv } from "../../env";
import { parseLimit } from "./helpers";

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

		const rows = await db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, c.get("user").id))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);

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
		const [updated] = await db
			.update(notifications)
			.set({ read: true })
			.where(
				and(
					eq(notifications.id, id),
					eq(notifications.userId, c.get("user").id),
				),
			)
			.returning({ id: notifications.id });

		if (!updated) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Notification not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
