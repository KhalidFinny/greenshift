CREATE TABLE `milestone_evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`milestone_id` integer NOT NULL,
	`kind` text DEFAULT 'document' NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text,
	`notes` text,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_milestone` ON `milestone_evidence` (`milestone_id`);--> statement-breakpoint
CREATE TABLE `negotiations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`iteration_number` integer NOT NULL,
	`status` text DEFAULT 'PENDING_VENDOR_RESPONSE' NOT NULL,
	`requested_price_reduction` real,
	`requested_warranty_years` integer,
	`requested_timeline_months` integer,
	`requested_fields` text DEFAULT '[]',
	`company_note` text NOT NULL,
	`vendor_revised_price` real,
	`vendor_revised_warranty_years` integer,
	`vendor_revised_timeline_months` integer,
	`vendor_response_note` text,
	`responded_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `negotiations_proposal_iteration_unique` ON `negotiations` (`proposal_id`,`iteration_number`);--> statement-breakpoint
CREATE INDEX `idx_negotiation_status` ON `negotiations` (`status`);--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`step_number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_date` integer,
	`due_date` integer,
	`completion_percent` real DEFAULT 0,
	`status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`vendor_notes` text,
	`company_review_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_milestone_project` ON `project_milestones` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_milestones_project_step_unique` ON `project_milestones` (`project_id`,`step_number`);--> statement-breakpoint
CREATE TABLE `vendor_portfolio_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_id` integer NOT NULL,
	`project_name` text NOT NULL,
	`client_name` text NOT NULL,
	`project_type` text,
	`location` text,
	`description` text,
	`project_value` real NOT NULL,
	`duration_months` integer,
	`services_provided` text,
	`energy_saving_percent` real,
	`carbon_reduction_tons` real,
	`completion_year` integer,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`document_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_portfolio_vendor` ON `vendor_portfolio_items` (`vendor_id`);