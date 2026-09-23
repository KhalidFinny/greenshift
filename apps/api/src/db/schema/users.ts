import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { CompanyDocumentScan } from "../../contracts";
import {
	companyDocumentSlots,
	companyVerificationStatuses,
} from "../../contracts";

export const userRoles = [
	"business",
	"investor",
	"vendor",
	"admin",
	"broker",
] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable(
	"users",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		email: text().notNull().unique(),
		role: text({ enum: userRoles }).notNull().default("business"),
		name: text().notNull(),
		hashedPassword: text("hashed_password"),
		/** Kept in sync by the entity profile writers; shown as the account's company. */
		companyName: text("company_name"),
		/** The company's sector. Company accounts only; vendors use their profile. */
		industrySector: text("industry_sector"),
		/** Registered address of the organization the account represents. */
		address: text(),
		phone: text(),
		avatar: text(),
		/** The certificates behind it are rows in `company_documents`. */
		nib: text(),
		npwp: text(),
		/** Stored rather than derived: every request is gated on this row. */
		verificationState: text("verification_state", {
			enum: companyVerificationStatuses,
		})
			.notNull()
			.default("NOT_VERIFIED"),
		/** How many times a scan has come back unreadable: the rescan budget. */
		verificationScanAttempts: integer("verification_scan_attempts")
			.notNull()
			.default(0),
		/** When the company filed its verification pack; `verifiedAt` is the verdict. */
		legalDocsSubmittedAt: integer("legal_docs_submitted_at", {
			mode: "timestamp_ms",
		}),
		verificationRejectionReason: text("verification_rejection_reason"),
		verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [index("idx_users_role").on(t.role)],
);

/** The registered company name, falling back to the account name when there is none. */
export const organizationName = sql<string>`coalesce(${users.companyName}, ${users.name})`;

/** The NIB and NPWP live on the account itself (`users.nib`, `users.npwp`). */
export const companyDocuments = sqliteTable(
	"company_documents",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		slot: text({ enum: companyDocumentSlots }).notNull(),
		fileName: text("file_name").notNull(),
		/** R2 object key. Served back through the download endpoint. */
		fileKey: text("file_key").notNull(),
		contentType: text("content_type"),
		sizeBytes: integer("size_bytes"),
		/** What the scan read off this certificate, and the verdict it reached. */
		scan: text({ mode: "json" }).$type<CompanyDocumentScan>(),
		uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("company_documents_user_slot_unique").on(t.userId, t.slot),
	],
);
