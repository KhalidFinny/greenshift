CREATE TABLE `draft_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_id` text NOT NULL,
	`slot` text NOT NULL,
	`file_name` text NOT NULL,
	`file_key` text NOT NULL,
	`content_type` text,
	`size_bytes` integer,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`draft_id`) REFERENCES `drafts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_draft_docs_draft` ON `draft_documents` (`draft_id`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` integer NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`step` integer DEFAULT 1,
	`project_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_drafts_company` ON `drafts` (`company_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `konsumsi_mwh` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `biaya_rp` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `faktor_emisi` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `target_pct` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `target_mwh` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `timeline_quarter` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `capex_rp` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `tenor_tahun` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `penghematan_rp` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `pendapatan_rp` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `jaminan` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `credit_score` real;--> statement-breakpoint
ALTER TABLE `projects` ADD `credit_rating` text;