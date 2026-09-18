import { relations } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ── Type helpers ────────────────────────────────────────────
export const userRoles = ["business", "vendor", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const projectStatuses = [
	"draft",
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

// ── users ──────────────────────────────────────────────────
export const users = sqliteTable(
	"users",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		email: text().notNull().unique(),
		role: text({ enum: userRoles }).notNull().default("business"),
		name: text().notNull(),
		hashedPassword: text("hashed_password"),
		companyName: text("company_name"),
		phone: text(),
		avatar: text(),
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

// ── vendor_profiles ──────────────────────────────────────
export const vendors = sqliteTable(
	"vendor_profiles",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyName: text("company_name").notNull(),
		description: text(),
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

// ── projects ─────────────────────────────────────────────
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
		// Project parameters
		targetEmissionReduction: real("target_emission_reduction"),
		estimatedEnergySaving: real("estimated_energy_saving"),
		budget: real(),
		location: text(),
		industrySector: text("industry_sector"),
		// Risk assessment result
		riskScore: real("risk_score"),
		riskSummary: text("risk_summary"),
		// Timestamps
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

// ── project_documents (Document Intelligence / OCR) ──────
export const projectDocuments = sqliteTable(
	"project_documents",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		type: text().notNull().default("utility_bill"), // utility_bill | audit_report | other
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

// ── risk_assessments ─────────────────────────────────────
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
		overallScore: real("overall_score"),
		// Mitigation
		recommendations: text({ mode: "json" }).$type<string[]>().default([]),
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

// ── vendor_match_scores (5-weight SPK breakdown) ─────────
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
		// 5 weighted criteria
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

// ── tenders ──────────────────────────────────────────────
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

// ── proposals ────────────────────────────────────────────
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
		// Timestamps
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

// ── proposal_revisions (max 3 revisions per proposal) ────
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

// ── blueprints (Green Project Blueprint) ──────────────────
export const blueprints = sqliteTable(
	"blueprints",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		status: text().notNull().default("draft"), // draft | audit | validated | rejected | published
		// Generated document blueprint
		document: text({ mode: "json" }).$type<{
			fundingStructure?: Record<string, number>;
			emissionTargets?: Record<string, number>;
			financialProjections?: {
				npv?: number;
				irr?: number;
				paybackPeriod?: number;
				scenarios?: {
					conservative: unknown;
					base: unknown;
					optimistic: unknown;
				};
			};
			[key: string]: unknown;
		}>(),
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

// ── energy_forecasts (AI Predictive Analytics) ────────────
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
		// SHAP interpretability values
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

// ── investments ──────────────────────────────────────────
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

// ── roi_payments (Smart ROI Tracker) ─────────────────────
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

// ── emission_reports (MRV) ──────────────────────────────
export const emissionReports = sqliteTable(
	"emission_reports",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		projectId: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		periodStart: integer("period_start", { mode: "timestamp_ms" }),
		periodEnd: integer("period_end", { mode: "timestamp_ms" }),
		// Energy & emission metrics
		actualConsumption: real("actual_consumption"),
		baselineConsumption: real("baseline_consumption"),
		emissionReduction: real("emission_reduction"),
		// Anomaly detection
		anomalyFlagged: integer("anomaly_flagged", { mode: "boolean" }).default(
			false,
		),
		anomalyScore: real("anomaly_score"),
		anomalyNote: text("anomaly_note"),
		// Full report data
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

// ── audit_logs (traceability / audit trail) ──────────────
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

// ── notifications ────────────────────────────────────────
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
