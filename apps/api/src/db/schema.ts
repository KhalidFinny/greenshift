import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
	BlueprintDocument,
	CompanyDocumentScan,
	ProposalAnnotation,
} from "../contracts";
import {
	companyDocumentSlots,
	companyVerificationStatuses,
} from "../contracts";

export const userRoles = [
	"business",
	"investor",
	"vendor",
	"admin",
	"broker",
] as const;
export type UserRole = (typeof userRoles)[number];

export const projectStatuses = [
	"draft",
	/** Submitted, waiting on the company to register it at the registry. */
	"registry",
	/** Registered and with the verification body: LVV verification in progress. */
	"assessment",
	"tendering",
	"blueprint",
	"funding",
	"monitoring",
	"completed",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const tenderMethods = ["open", "closed", "direct"] as const;
export type TenderMethod = (typeof tenderMethods)[number];

export const users = sqliteTable(
	"users",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		email: text().notNull().unique(),
		role: text({ enum: userRoles }).notNull().default("business"),
		name: text().notNull(),
		hashedPassword: text("hashed_password"),
		/**
		 * The organization the account represents, not the person behind it: kept in
		 * sync by the entity profile writers and shown as the account's company.
		 */
		companyName: text("company_name"),
		/** The company's sector. Company accounts only; vendors use their profile. */
		industrySector: text("industry_sector"),
		/** Registered address of the organization the account represents. */
		address: text(),
		phone: text(),
		avatar: text(),
		/**
		 * The legal identity a company account is verified against, filed by the company:
		 * the certificates behind them are rows in `company_documents`.
		 */
		nib: text(),
		npwp: text(),
		/**
		 * Where the account stands, as the scan or an administrator decided it. Stored
		 * rather than derived, because every request is gated on this row.
		 */
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

export const usersRelations = relations(users, ({ one, many }) => ({
	projects: many(projects, { relationName: "company_projects" }),
	vendorProfile: one(vendors),
	investments: many(investments),
	blueprintValidations: many(blueprints),
}));

/**
 * The organization an account represents as a list labels it: the registered
 * company name, falling back to the account name when there is none.
 */
export const organizationName = sql<string>`coalesce(${users.companyName}, ${users.name})`;

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

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
	user: one(users, { fields: [vendors.userId], references: [users.id] }),
	proposals: many(proposals),
}));

export const projects = sqliteTable(
	"projects",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		companyId: integer("company_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text().notNull(),
		description: text(),
		status: text({ enum: projectStatuses }).notNull().default("draft"),
		targetEmissionReduction: real("target_emission_reduction"),
		estimatedEnergySaving: real("estimated_energy_saving"),
		budget: real(),
		location: text(),
		industrySector: text("industry_sector"),
		// Business wizard inputs, stored explicitly rather than as a JSON blob: the risk
		// read recomputes from these and money is queried.
		konsumsiMwh: real("konsumsi_mwh"),
		biayaRp: real("biaya_rp"),
		faktorEmisi: real("faktor_emisi"),
		targetPct: real("target_pct"),
		targetMwh: real("target_mwh"),
		timelineQuarter: text("timeline_quarter"),
		capexRp: real("capex_rp"),
		tenorTahun: integer("tenor_tahun"),
		penghematanRp: real("penghematan_rp"),
		pendapatanRp: real("pendapatan_rp"),
		jaminan: text(),
		// Derived at submit and persisted; never accepted from the client.
		creditScore: real("credit_score"),
		creditRating: text("credit_rating"),
		// Scope of work, shown to bidders on the project detail. Kept as JSON
		// arrays because a project carries an open-ended number of each.
		technicalRequirements: text("technical_requirements", { mode: "json" })
			.$type<string[]>()
			.default([]),
		deliverables: text({ mode: "json" }).$type<string[]>().default([]),
		riskScore: real("risk_score"),
		riskSummary: text("risk_summary"),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		completedAt: integer("completed_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		index("idx_projects_company").on(t.companyId),
		index("idx_projects_status").on(t.status),
	],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
	company: one(users, {
		fields: [projects.companyId],
		references: [users.id],
		relationName: "company_projects",
	}),
	documents: many(projectDocuments),
	riskAssessment: one(riskAssessments),
	tenders: many(tenders),
	blueprints: many(blueprints),
	investments: many(investments),
	emissionReports: many(emissionReports),
	forecasts: many(energyForecasts),
}));

/**
 * One wizard draft. The id is client-generated so autosave can upsert without
 * a create round trip.
 */
export const drafts = sqliteTable(
	"drafts",
	{
		id: text().primaryKey(),
		companyId: integer("company_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		/** The merged Step 1-3 blocks. An absent key means untouched. */
		payload: text({ mode: "json" })
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		step: integer().default(1),
		/** Set on submit, so a replay answers 409 with the project it created. */
		projectId: integer("project_id").references(() => projects.id, {
			onDelete: "set null",
		}),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [index("idx_drafts_company").on(t.companyId)],
);

/**
 * Files attached to an unsubmitted draft. They live here because
 * `project_documents` requires a project, which does not exist until submit.
 */
export const draftDocuments = sqliteTable(
	"draft_documents",
	{
		/** Opaque id handed to the client as a `fileId`. */
		id: text().primaryKey(),
		draftId: text("draft_id")
			.notNull()
			.references(() => drafts.id, { onDelete: "cascade" }),
		/** Wizard slot: the Step 1 trio, the Step 3 six, or lapkeu/rab. */
		slot: text().notNull(),
		fileName: text("file_name").notNull(),
		/** R2 object key. Served back through the download endpoint. */
		fileKey: text("file_key").notNull(),
		contentType: text("content_type"),
		sizeBytes: integer("size_bytes"),
		uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [index("idx_draft_docs_draft").on(t.draftId)],
);

export const projectDocuments = sqliteTable(
	"project_documents",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		type: text().notNull().default("utility_bill"), // slot: nib | akta | lapkeu | rab | …
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url"),
		ocrStatus: text("ocr_status").default("pending"), // pending | processing | done | failed
		extractedData: text("extracted_data", { mode: "json" }).$type<{
			totalKwh?: number;
			monthlyCost?: number;
			billingPeriod?: string;
			facilityName?: string;
			[key: string]: unknown;
		}>(),
		uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [index("idx_docs_project").on(t.projectId)],
);

export const projectDocumentsRelations = relations(
	projectDocuments,
	({ one }) => ({
		project: one(projects, {
			fields: [projectDocuments.projectId],
			references: [projects.id],
		}),
	}),
);

export const riskAssessments = sqliteTable(
	"risk_assessments",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		// Composite score breakdown (0-100 scale)
		financialScore: real("financial_score"),
		technicalScore: real("technical_score"),
		implementationScore: real("implementation_score"),
		environmentalScore: real("environmental_score"),
		overallScore: real("overall_score"),
		recommendations: text({ mode: "json" }).$type<string[]>().default([]),
		notes: text(),
		/**
		 * Eleanor's written reading of this assessment, written once at submission and
		 * kept with the record so the analysis cannot drift from its figures.
		 */
		insight: text(),
		/** "ai" when Workers AI wrote it, "model" when the analyst composed it. */
		insightSource: text("insight_source"),
		assessedBy: text("assessed_by"), // system or user id
		assessedAt: integer("assessed_at", { mode: "timestamp_ms" }),
	},
	(t) => [index("idx_risk_project").on(t.projectId)],
);

export const riskAssessmentsRelations = relations(
	riskAssessments,
	({ one }) => ({
		project: one(projects, {
			fields: [riskAssessments.projectId],
			references: [projects.id],
		}),
	}),
);

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

export const vendorMatchScoresRelations = relations(
	vendorMatchScores,
	({ one }) => ({
		project: one(projects, {
			fields: [vendorMatchScores.projectId],
			references: [projects.id],
		}),
		vendor: one(vendors, {
			fields: [vendorMatchScores.vendorId],
			references: [vendors.id],
		}),
	}),
);

/**
 * The company's choice: the vendor it appoints and the procurement route it
 * will run. `method` shares `tenderMethods` with the tender this opens.
 */
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
		// Kept beside the id so the list keeps the name the company actually
		// chose, even if the vendor profile is renamed afterwards.
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

export const vendorAssignmentsRelations = relations(
	vendorAssignments,
	({ one }) => ({
		project: one(projects, {
			fields: [vendorAssignments.projectId],
			references: [projects.id],
		}),
		vendor: one(vendors, {
			fields: [vendorAssignments.vendorId],
			references: [vendors.id],
		}),
	}),
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

export const tendersRelations = relations(tenders, ({ one, many }) => ({
	project: one(projects, {
		fields: [tenders.projectId],
		references: [projects.id],
	}),
	proposals: many(proposals),
}));

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

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
	tender: one(tenders, {
		fields: [proposals.tenderId],
		references: [tenders.id],
	}),
	vendor: one(vendors, {
		fields: [proposals.vendorId],
		references: [vendors.id],
	}),
	revisions: many(proposalRevisions),
}));

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

export const proposalRevisionsRelations = relations(
	proposalRevisions,
	({ one }) => ({
		proposal: one(proposals, {
			fields: [proposalRevisions.proposalId],
			references: [proposals.id],
		}),
	}),
);

export const blueprints = sqliteTable(
	"blueprints",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		status: text().notNull().default("draft"), // draft | audit | validated | rejected | published
		document: text({ mode: "json" }).$type<BlueprintDocument>(),
		auditorId: integer("auditor_id").references(() => users.id),
		auditNote: text("audit_note"),
		validatedAt: integer("validated_at", { mode: "timestamp_ms" }),
		publishedAt: integer("published_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		index("idx_blueprint_project").on(t.projectId),
		index("idx_blueprint_auditor").on(t.auditorId),
	],
);

export const blueprintsRelations = relations(blueprints, ({ one }) => ({
	project: one(projects, {
		fields: [blueprints.projectId],
		references: [projects.id],
	}),
	auditor: one(users, {
		fields: [blueprints.auditorId],
		references: [users.id],
	}),
}));

export const energyForecasts = sqliteTable(
	"energy_forecasts",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		periodStart: integer("period_start", { mode: "timestamp_ms" }),
		periodEnd: integer("period_end", { mode: "timestamp_ms" }),
		forecastedConsumption: real("forecasted_consumption"), // kWh
		forecastedSavings: real("forecasted_savings"), // kWh
		modelName: text("model_name").default("random_forest"),
		shapValues: text("shap_values", { mode: "json" }),
		metrics: text({ mode: "json" }).$type<{
			mae?: number;
			rmse?: number;
			r2?: number;
			cvRmse?: number;
		}>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [index("idx_forecast_project").on(t.projectId)],
);

export const energyForecastsRelations = relations(
	energyForecasts,
	({ one }) => ({
		project: one(projects, {
			fields: [energyForecasts.projectId],
			references: [projects.id],
		}),
	}),
);

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

export const investmentsRelations = relations(investments, ({ one, many }) => ({
	project: one(projects, {
		fields: [investments.projectId],
		references: [projects.id],
	}),
	investor: one(users, {
		fields: [investments.investorId],
		references: [users.id],
	}),
	payments: many(roiPayments),
}));

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

export const roiPaymentsRelations = relations(roiPayments, ({ one }) => ({
	investment: one(investments, {
		fields: [roiPayments.investmentId],
		references: [investments.id],
	}),
}));

export const emissionReports = sqliteTable(
	"emission_reports",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		periodStart: integer("period_start", { mode: "timestamp_ms" }),
		periodEnd: integer("period_end", { mode: "timestamp_ms" }),
		actualConsumption: real("actual_consumption"),
		baselineConsumption: real("baseline_consumption"),
		emissionReduction: real("emission_reduction"),
		anomalyFlagged: integer("anomaly_flagged", { mode: "boolean" }).default(
			false,
		),
		anomalyScore: real("anomaly_score"),
		anomalyNote: text("anomaly_note"),
		reportData: text("report_data", { mode: "json" }),
		verifiedBy: integer("verified_by").references(() => users.id),
		verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("idx_emission_project").on(t.projectId),
		index("idx_emission_period").on(t.periodStart, t.periodEnd),
	],
);

export const emissionReportsRelations = relations(
	emissionReports,
	({ one }) => ({
		project: one(projects, {
			fields: [emissionReports.projectId],
			references: [projects.id],
		}),
	}),
);

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

export const negotiationStatuses = [
	"PENDING_VENDOR_RESPONSE",
	"SUBMITTED_BY_VENDOR",
	"AGREED",
	"LOCKED",
] as const;
export type NegotiationStatus = (typeof negotiationStatuses)[number];

export const maxNegotiationIterations = 3;

/**
 * How many of a project's ranked vendors the company is offered: a direct
 * selection appoints one, a closed tender invites only these.
 */
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
		// Where the company marked the proposal it is asking about, in the
		// proposal page's own 0-1 coordinates so both sides draw the same marks.
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

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
	proposal: one(proposals, {
		fields: [negotiations.proposalId],
		references: [proposals.id],
	}),
}));

export const milestoneStatuses = [
	"NOT_STARTED",
	"IN_PROGRESS",
	"SUBMITTED_FOR_REVIEW",
	"APPROVED",
	"REVISION_REQUIRED",
	"COMPLETED",
] as const;
export type MilestoneStatus = (typeof milestoneStatuses)[number];

export const projectMilestones = sqliteTable(
	"project_milestones",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		stepNumber: integer("step_number").notNull(),
		title: text().notNull(),
		description: text(),
		startDate: integer("start_date", { mode: "timestamp_ms" }),
		dueDate: integer("due_date", { mode: "timestamp_ms" }),
		completionPercent: real("completion_percent").default(0),
		status: text({ enum: milestoneStatuses }).notNull().default("NOT_STARTED"),
		vendorNotes: text("vendor_notes"),
		companyReviewNotes: text("company_review_notes"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		index("idx_milestone_project").on(t.projectId),
		uniqueIndex("project_milestones_project_step_unique").on(
			t.projectId,
			t.stepNumber,
		),
	],
);

export const projectMilestonesRelations = relations(
	projectMilestones,
	({ one, many }) => ({
		project: one(projects, {
			fields: [projectMilestones.projectId],
			references: [projects.id],
		}),
		evidence: many(milestoneEvidence),
	}),
);

export const evidenceKinds = [
	"photo",
	"video",
	"document",
	"inspection",
	"energy_data",
] as const;
export type EvidenceKind = (typeof evidenceKinds)[number];

export const milestoneEvidence = sqliteTable(
	"milestone_evidence",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		milestoneId: integer("milestone_id")
			.notNull()
			.references(() => projectMilestones.id, { onDelete: "cascade" }),
		kind: text({ enum: evidenceKinds }).notNull().default("document"),
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url"),
		notes: text(),
		uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [index("idx_evidence_milestone").on(t.milestoneId)],
);

export const milestoneEvidenceRelations = relations(
	milestoneEvidence,
	({ one }) => ({
		milestone: one(projectMilestones, {
			fields: [milestoneEvidence.milestoneId],
			references: [projectMilestones.id],
		}),
	}),
);

/**
 * The certificates a company files to prove it is a real entity, one file per
 * slot. The NIB and NPWP live on the account itself (`users.nib`, `users.npwp`).
 */
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

export const companyDocumentsRelations = relations(
	companyDocuments,
	({ one }) => ({
		user: one(users, {
			fields: [companyDocuments.userId],
			references: [users.id],
		}),
	}),
);

/**
 * A record of delivered work. Nothing in the platform verifies a vendor's own
 * reference; the profile is what an administrator checks.
 */
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

export const vendorPortfolioItemsRelations = relations(
	vendorPortfolioItems,
	({ one }) => ({
		vendor: one(vendors, {
			fields: [vendorPortfolioItems.vendorId],
			references: [vendors.id],
		}),
	}),
);

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

export const brokerProfilesRelations = relations(brokerProfiles, ({ one }) => ({
	user: one(users, {
		fields: [brokerProfiles.userId],
		references: [users.id],
	}),
}));

/**
 * The Broker's own bond-preparation lifecycle (§20), separate from the project
 * lifecycle: "COMPLETED" here means the Broker finished its part.
 */
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

export const brokerAssignmentsRelations = relations(
	brokerAssignments,
	({ one, many }) => ({
		project: one(projects, {
			fields: [brokerAssignments.projectId],
			references: [projects.id],
		}),
		broker: one(users, {
			fields: [brokerAssignments.brokerId],
			references: [users.id],
		}),
		documentRequests: many(documentRequests),
	}),
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
		// Company submission
		submittedFileName: text("submitted_file_name"),
		submittedFileUrl: text("submitted_file_url"),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		// Broker review
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

export const documentRequestsRelations = relations(
	documentRequests,
	({ one }) => ({
		assignment: one(brokerAssignments, {
			fields: [documentRequests.assignmentId],
			references: [brokerAssignments.id],
		}),
		project: one(projects, {
			fields: [documentRequests.projectId],
			references: [projects.id],
		}),
	}),
);
