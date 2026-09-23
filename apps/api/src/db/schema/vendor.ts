import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { CompanyDocumentScan } from "../../contracts";
import { users } from "./users";

export const vendors = sqliteTable(
	"vendor_profiles",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyName: text("company_name").notNull(),
		description: text(),
		/** What the vendor delivers (ESCO, solar EPC, audits). Scored as vendor text. */
		serviceCategory: text("service_category"),
		/** Where the vendor works from: proximity is part of what it delivers at. */
		location: text(),
		/** Legal identity, required before an admin can verify the profile. */
		nib: text(),
		npwp: text(),
		/** Company registration number, required with the NPWP. */
		tdp: text(),
		/** The ESCO or ISO certificate the vendor filed, held in R2 with the scan's reading. */
		certificateName: text("certificate_name"),
		certificateKey: text("certificate_key"),
		certificateScan: text("certificate_scan", {
			mode: "json",
		}).$type<CompanyDocumentScan>(),
		/** Why an administrator turned the profile down, as the vendor reads it. */
		verificationRejectionReason: text("verification_rejection_reason"),
		certifications: text({ mode: "json" }).$type<string[]>().default([]),
		portfolio: text({ mode: "json" }).$type<string[]>().default([]),
		rating: real().default(0),
		totalProjects: integer("total_projects").default(0),
		verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [uniqueIndex("vendor_profiles_user_id_unique").on(t.userId)],
);

/** Nothing verifies a vendor's own reference; the profile is what an admin checks. */
export const vendorPortfolioItems = sqliteTable(
	"vendor_portfolio_items",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		vendorId: integer("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),
		projectName: text("project_name").notNull(),
		clientName: text("client_name").notNull(),
		projectType: text("project_type"),
		location: text(),
		description: text(),
		projectValue: real("project_value").notNull(),
		durationMonths: integer("duration_months"),
		servicesProvided: text("services_provided"),
		energySavingPercent: real("energy_saving_percent"),
		carbonReductionTons: real("carbon_reduction_tons"),
		completionYear: integer("completion_year"),
		documentName: text("document_name"),
		/** R2 object key of the supporting document, or null when none is filed. */
		documentKey: text("document_key"),
		documentType: text("document_type"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [index("idx_portfolio_vendor").on(t.vendorId)],
);
