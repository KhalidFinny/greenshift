CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`user_id` integer,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_project` ON `audit_logs` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `blueprints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`document` text,
	`auditor_id` integer,
	`audit_note` text,
	`validated_at` integer,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`auditor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_blueprint_project` ON `blueprints` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_blueprint_auditor` ON `blueprints` (`auditor_id`);--> statement-breakpoint
CREATE TABLE `emission_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`actual_consumption` real,
	`baseline_consumption` real,
	`emission_reduction` real,
	`anomaly_flagged` integer DEFAULT false,
	`anomaly_score` real,
	`anomaly_note` text,
	`report_data` text,
	`verified_by` integer,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_emission_project` ON `emission_reports` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_emission_period` ON `emission_reports` (`period_start`,`period_end`);--> statement-breakpoint
CREATE TABLE `energy_forecasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`forecasted_consumption` real,
	`forecasted_savings` real,
	`model_name` text DEFAULT 'random_forest',
	`shap_values` text,
	`metrics` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_forecast_project` ON `energy_forecasts` (`project_id`);--> statement-breakpoint
CREATE TABLE `investments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`investor_id` integer NOT NULL,
	`amount` real NOT NULL,
	`roi_paid` real DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL,
	`bond_serial_number` text,
	`invested_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`investor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_investment_project` ON `investments` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_investment_investor` ON `investments` (`investor_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`read` integer DEFAULT false NOT NULL,
	`link` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notif_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notif_read` ON `notifications` (`user_id`,`read`);--> statement-breakpoint
CREATE TABLE `project_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`type` text DEFAULT 'utility_bill' NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text,
	`ocr_status` text DEFAULT 'pending',
	`extracted_data` text,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_docs_project` ON `project_documents` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`target_emission_reduction` real,
	`estimated_energy_saving` real,
	`budget` real,
	`location` text,
	`industry_sector` text,
	`risk_score` real,
	`risk_summary` text,
	`submitted_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_projects_company` ON `projects` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_status` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `proposal_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`revision_number` integer NOT NULL,
	`note` text,
	`amount` real,
	`previous_amount` real,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_revision_proposal` ON `proposal_revisions` (`proposal_id`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tender_id` integer NOT NULL,
	`vendor_id` integer NOT NULL,
	`amount` real NOT NULL,
	`technical_spec` text,
	`operational_cost` real,
	`projected_roi` real,
	`warranty_period` integer,
	`status` text DEFAULT 'submitted' NOT NULL,
	`revision_count` integer DEFAULT 0,
	`submitted_at` integer,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tender_id`) REFERENCES `tenders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_proposal_tender` ON `proposals` (`tender_id`);--> statement-breakpoint
CREATE INDEX `idx_proposal_vendor` ON `proposals` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `risk_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`financial_score` real,
	`technical_score` real,
	`implementation_score` real,
	`overall_score` real,
	`recommendations` text DEFAULT '[]',
	`assessed_by` text,
	`assessed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_risk_project` ON `risk_assessments` (`project_id`);--> statement-breakpoint
CREATE TABLE `roi_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`investment_id` integer NOT NULL,
	`amount` real NOT NULL,
	`period` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`escrow_tx_id` text,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `investments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_roi_investment` ON `roi_payments` (`investment_id`);--> statement-breakpoint
CREATE TABLE `tenders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`budget_min` real,
	`budget_max` real,
	`deadline_at` integer,
	`awarded_proposal_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tender_project` ON `tenders` (`project_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'business' NOT NULL,
	`name` text NOT NULL,
	`hashed_password` text,
	`company_name` text,
	`phone` text,
	`avatar` text,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `vendor_match_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`vendor_id` integer NOT NULL,
	`technical_fit` real,
	`relevant_experience` real,
	`historical_performance` real,
	`price_value` real,
	`project_risk` real,
	`total_score` real,
	`rank` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_match_project` ON `vendor_match_scores` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_match_vendor` ON `vendor_match_scores` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `vendor_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`company_name` text NOT NULL,
	`description` text,
	`certifications` text DEFAULT '[]',
	`portfolio` text DEFAULT '[]',
	`rating` real DEFAULT 0,
	`total_projects` integer DEFAULT 0,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_vendor_user` ON `vendor_profiles` (`user_id`);