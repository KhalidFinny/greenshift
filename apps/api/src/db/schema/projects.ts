import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import type { BlueprintDocument } from "../../contracts";
import { users } from "./users";

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
		// Stored explicitly rather than as a JSON blob: the risk read recomputes from these.
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
		// Kept as JSON arrays because a project carries an open-ended number of each.
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

/** The id is client-generated so autosave can upsert without a create round trip. */
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

/** `project_documents` requires a project, which does not exist until submit. */
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
		/** Written once at submission, so the analysis cannot drift from its figures. */
		insight: text(),
		/** "ai" when Workers AI wrote it, "model" when the analyst composed it. */
		insightSource: text("insight_source"),
		assessedBy: text("assessed_by"), // system or user id
		assessedAt: integer("assessed_at", { mode: "timestamp_ms" }),
	},
	(t) => [index("idx_risk_project").on(t.projectId)],
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
