import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./projects";
import { users } from "./users";

export const auditLogs = sqliteTable(
	"audit_logs",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id").references(() => projects.id, {
			onDelete: "set null",
		}),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		action: text().notNull(), // project.created | tender.opened | proposal.submitted | etc
		entityType: text("entity_type"), // project | tender | proposal | blueprint | etc
		entityId: integer("entity_id"),
		metadata: text({ mode: "json" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_audit_project").on(t.projectId),
		index("idx_audit_user").on(t.userId),
		index("idx_audit_action").on(t.action),
		index("idx_audit_created").on(t.createdAt),
	],
);

export const notifications = sqliteTable(
	"notifications",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text().notNull(), // anomaly | status_change | deadline | payment
		title: text().notNull(),
		body: text(),
		read: integer({ mode: "boolean" }).notNull().default(false),
		link: text(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_notif_user").on(t.userId),
		index("idx_notif_read").on(t.userId, t.read),
	],
);
