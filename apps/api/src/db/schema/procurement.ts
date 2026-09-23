import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { ProposalAnnotation } from "../../contracts";
import { projects } from "./projects";
import { vendors } from "./vendor";

export const tenderMethods = ["open", "closed", "direct"] as const;
export type TenderMethod = (typeof tenderMethods)[number];

export const vendorMatchScores = sqliteTable(
	"vendor_match_scores",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		vendorId: integer("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),
		technicalFit: real("technical_fit"),
		relevantExperience: real("relevant_experience"),
		historicalPerformance: real("historical_performance"),
		priceValue: real("price_value"),
		projectRisk: real("project_risk"),
		totalScore: real("total_score"),
		rank: integer(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_match_project").on(t.projectId),
		index("idx_match_vendor").on(t.vendorId),
	],
);

/** `method` shares `tenderMethods` with the tender this opens. */
export const vendorAssignments = sqliteTable(
	"vendor_assignments",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		vendorId: integer("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),
		// Kept beside the id so the list keeps the chosen name if the profile is renamed.
		vendorName: text("vendor_name").notNull(),
		method: text({ enum: tenderMethods }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [uniqueIndex("vendor_assignments_project_unique").on(t.projectId)],
);

export const tenders = sqliteTable(
	"tenders",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		method: text({ enum: tenderMethods }).notNull(),
		status: text().notNull().default("open"), // open | evaluation | closed | awarded
		budgetMin: real("budget_min"),
		budgetMax: real("budget_max"),
		deadlineAt: integer("deadline_at", { mode: "timestamp_ms" }),
		awardedProposalId: integer("awarded_proposal_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [index("idx_tender_project").on(t.projectId)],
);

export const proposals = sqliteTable(
	"proposals",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		tenderId: integer("tender_id")
			.notNull()
			.references(() => tenders.id, { onDelete: "cascade" }),
		vendorId: integer("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),
		amount: real().notNull(),
		technicalSpec: text("technical_spec"),
		operationalCost: real("operational_cost"),
		projectedRoi: real("projected_roi"),
		warrantyPeriod: integer("warranty_period"), // months
		status: text().notNull().default("submitted"), // submitted | reviewed | revision | accepted | rejected
		revisionCount: integer("revision_count").default(0),
		/** The proposal document the vendor filed, if any: PDF, held in R2. */
		documentName: text("document_name"),
		documentKey: text("document_key"),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("proposals_tender_vendor_unique").on(t.tenderId, t.vendorId),
		index("idx_proposal_vendor").on(t.vendorId),
	],
);

export const proposalRevisions = sqliteTable(
	"proposal_revisions",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		proposalId: integer("proposal_id")
			.notNull()
			.references(() => proposals.id, { onDelete: "cascade" }),
		revisionNumber: integer("revision_number").notNull(),
		note: text(),
		amount: real(),
		previousAmount: real("previous_amount"),
		createdBy: text("created_by"), // company | vendor
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("proposal_revisions_proposal_number_unique").on(
			t.proposalId,
			t.revisionNumber,
		),
	],
);

export const negotiationStatuses = [
	"PENDING_VENDOR_RESPONSE",
	"SUBMITTED_BY_VENDOR",
	"AGREED",
	"LOCKED",
] as const;
export type NegotiationStatus = (typeof negotiationStatuses)[number];

export const maxNegotiationIterations = 3;

/** A direct selection appoints one, a closed tender invites only these. */
export const matchShortlistSize = 3;

export const negotiations = sqliteTable(
	"negotiations",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		proposalId: integer("proposal_id")
			.notNull()
			.references(() => proposals.id, { onDelete: "cascade" }),
		iterationNumber: integer("iteration_number").notNull(),
		status: text({ enum: negotiationStatuses })
			.notNull()
			.default("PENDING_VENDOR_RESPONSE"),
		requestedPriceReduction: real("requested_price_reduction"),
		requestedWarrantyYears: integer("requested_warranty_years"),
		requestedTimelineMonths: integer("requested_timeline_months"),
		requestedFields: text("requested_fields", { mode: "json" })
			.$type<string[]>()
			.default([]),
		companyNote: text("company_note").notNull(),
		// In the proposal page's own 0-1 coordinates, so both sides draw the same marks.
		annotations: text("annotations", { mode: "json" })
			.$type<ProposalAnnotation[]>()
			.default([]),
		vendorRevisedPrice: real("vendor_revised_price"),
		vendorRevisedWarrantyYears: integer("vendor_revised_warranty_years"),
		vendorRevisedTimelineMonths: integer("vendor_revised_timeline_months"),
		vendorResponseNote: text("vendor_response_note"),
		respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("negotiations_proposal_iteration_unique").on(
			t.proposalId,
			t.iterationNumber,
		),
		index("idx_negotiation_status").on(t.status),
	],
);
