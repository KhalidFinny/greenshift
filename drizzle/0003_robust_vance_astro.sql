CREATE TABLE `broker_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`broker_id` integer NOT NULL,
	`company_id` integer NOT NULL,
	`status` text DEFAULT 'ASSIGNED' NOT NULL,
	`decline_reason` text,
	`information_request` text,
	`assigned_at` integer NOT NULL,
	`responded_at` integer,
	`completed_at` integer,
	`bond_status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`bond_serial_number` text,
	`bond_amount` real,
	`tenor_months` integer,
	`coupon_rate_percent` real,
	`issuance_date` integer,
	`maturity_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`broker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `broker_assignments_project_broker_unique` ON `broker_assignments` (`project_id`,`broker_id`);--> statement-breakpoint
CREATE INDEX `idx_broker_assignment_broker` ON `broker_assignments` (`broker_id`);--> statement-breakpoint
CREATE INDEX `idx_broker_assignment_project` ON `broker_assignments` (`project_id`);--> statement-breakpoint
CREATE TABLE `broker_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`company_name` text NOT NULL,
	`description` text,
	`representative` text,
	`contact_email` text,
	`contact_phone` text,
	`website` text,
	`address` text,
	`nib` text,
	`financial_license_number` text,
	`license_authority` text,
	`submitted_at` integer,
	`verified_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `broker_profiles_user_id_unique` ON `broker_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `document_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`broker_id` integer NOT NULL,
	`company_id` integer NOT NULL,
	`category` text NOT NULL,
	`document_type_name` text NOT NULL,
	`required_period` text,
	`reason` text NOT NULL,
	`deadline_date` integer,
	`additional_notes` text,
	`status` text DEFAULT 'REQUESTED' NOT NULL,
	`submitted_file_name` text,
	`submitted_file_url` text,
	`submitted_at` integer,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `broker_assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`broker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_docreq_assignment` ON `document_requests` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `idx_docreq_broker` ON `document_requests` (`broker_id`);--> statement-breakpoint
CREATE INDEX `idx_docreq_project` ON `document_requests` (`project_id`);--> statement-breakpoint
ALTER TABLE `risk_assessments` ADD `environmental_score` real;--> statement-breakpoint
ALTER TABLE `risk_assessments` ADD `notes` text;