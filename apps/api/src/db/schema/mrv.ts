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
