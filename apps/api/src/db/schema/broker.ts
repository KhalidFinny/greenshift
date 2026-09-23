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

export const brokerProfiles = sqliteTable(
	"broker_profiles",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyName: text("company_name").notNull(),
		description: text(),
		representative: text(),
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),
		website: text(),
		address: text(),
		// Verification filing (broker registration is self-service, §6)
		nib: text(),
		financialLicenseNumber: text("financial_license_number"),
		licenseAuthority: text("license_authority"),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
		rejectionReason: text("rejection_reason"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [uniqueIndex("broker_profiles_user_id_unique").on(t.userId)],
);

/** "COMPLETED" means the Broker finished its part, separate from the project lifecycle (§20). */
export const brokerWorkflowStatuses = [
	"ASSIGNED",
	"DECLINED",
	"DOCUMENT_COLLECTION",
	"UNDER_REVIEW",
	"READY_FOR_BOND_ISSUANCE",
	"BOND_ISSUANCE",
	"MONITORING",
	"COMPLETED",
] as const;
export type BrokerWorkflowStatus = (typeof brokerWorkflowStatuses)[number];

/** High-level tracking of the bond process that runs outside GreenShift (§25). */
export const bondIssuanceStatuses = [
	"NOT_STARTED",
	"IN_PROGRESS",
	"ISSUED",
] as const;
export type BondIssuanceStatus = (typeof bondIssuanceStatuses)[number];

export const brokerAssignments = sqliteTable(
	"broker_assignments",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		brokerId: integer("broker_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyId: integer("company_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text({ enum: brokerWorkflowStatuses })
			.notNull()
			.default("ASSIGNED"),
		declineReason: text("decline_reason"),
		informationRequest: text("information_request"),
		assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
		completedAt: integer("completed_at", { mode: "timestamp_ms" }),
		// Bond tracking (§26): the transaction itself happens outside GreenShift.
		bondStatus: text("bond_status", { enum: bondIssuanceStatuses })
			.notNull()
			.default("NOT_STARTED"),
		bondSerialNumber: text("bond_serial_number"),
		bondAmount: real("bond_amount"),
		tenorMonths: integer("tenor_months"),
		couponRatePercent: real("coupon_rate_percent"),
		issuanceDate: integer("issuance_date", { mode: "timestamp_ms" }),
		maturityDate: integer("maturity_date", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("broker_assignments_project_broker_unique").on(
			t.projectId,
			t.brokerId,
		),
		index("idx_broker_assignment_broker").on(t.brokerId),
		index("idx_broker_assignment_project").on(t.projectId),
	],
);

export const documentCategories = [
	"Legal",
	"Financial",
	"Project",
	"Technical",
	"Other",
] as const;
export type DocumentCategory = (typeof documentCategories)[number];

/** Document lifecycle (§18). */
export const documentRequestStatuses = [
	"REQUESTED",
	"SUBMITTED",
	"UNDER_REVIEW",
	"APPROVED",
	"REJECTED",
	"RESUBMISSION",
] as const;
export type DocumentRequestStatus = (typeof documentRequestStatuses)[number];

export const documentRequests = sqliteTable(
	"document_requests",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		assignmentId: integer("assignment_id")
			.notNull()
			.references(() => brokerAssignments.id, { onDelete: "cascade" }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		brokerId: integer("broker_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyId: integer("company_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		category: text({ enum: documentCategories }).notNull(),
		documentTypeName: text("document_type_name").notNull(),
		requiredPeriod: text("required_period"),
		reason: text().notNull(),
		deadlineDate: integer("deadline_date", { mode: "timestamp_ms" }),
		additionalNotes: text("additional_notes"),
		status: text({ enum: documentRequestStatuses })
			.notNull()
			.default("REQUESTED"),
		submittedFileName: text("submitted_file_name"),
		submittedFileUrl: text("submitted_file_url"),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
		rejectionReason: text("rejection_reason"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		index("idx_docreq_assignment").on(t.assignmentId),
		index("idx_docreq_broker").on(t.brokerId),
		index("idx_docreq_project").on(t.projectId),
	],
);
