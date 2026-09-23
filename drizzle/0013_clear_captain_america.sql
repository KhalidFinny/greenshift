CREATE TABLE `company_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slot` text NOT NULL,
	`file_name` text NOT NULL,
	`file_key` text NOT NULL,
	`content_type` text,
	`size_bytes` integer,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_documents_user_slot_unique` ON `company_documents` (`user_id`,`slot`);--> statement-breakpoint
ALTER TABLE `users` ADD `nib` text;--> statement-breakpoint
ALTER TABLE `users` ADD `npwp` text;--> statement-breakpoint
ALTER TABLE `users` ADD `legal_docs_submitted_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_rejection_reason` text;