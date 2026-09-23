ALTER TABLE `company_documents` ADD `scan` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_state` text DEFAULT 'NOT_VERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_scan_attempts` integer DEFAULT 0 NOT NULL;