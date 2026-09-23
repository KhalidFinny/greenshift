import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { projects } from "./projects";
import { users } from "./users";

export const investments = sqliteTable(
	"investments",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		investorId: integer("investor_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		amount: real().notNull(),
		roiPaid: real("roi_paid").default(0),
		status: text().notNull().default("active"), // active | completed | defaulted
		bondSerialNumber: text("bond_serial_number"),
		investedAt: integer("invested_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_investment_project").on(t.projectId),
		index("idx_investment_investor").on(t.investorId),
		uniqueIndex("investments_bond_serial_unique").on(t.bondSerialNumber),
	],
);

export const roiPayments = sqliteTable(
	"roi_payments",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		investmentId: integer("investment_id")
			.notNull()
			.references(() => investments.id, { onDelete: "cascade" }),
		amount: real().notNull(),
		period: text(), // e.g. "2026-Q1"
		status: text().notNull().default("scheduled"), // scheduled | paid | failed
		escrowTxId: text("escrow_tx_id"),
		paidAt: integer("paid_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_roi_investment").on(t.investmentId),
		uniqueIndex("roi_payments_escrow_tx_unique").on(t.escrowTxId),
	],
);
