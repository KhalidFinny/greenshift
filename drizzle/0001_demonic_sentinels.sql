DROP INDEX `idx_revision_proposal`;--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_revisions_proposal_number_unique` ON `proposal_revisions` (`proposal_id`,`revision_number`);--> statement-breakpoint
DROP INDEX `idx_proposal_tender`;--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_tender_vendor_unique` ON `proposals` (`tender_id`,`vendor_id`);--> statement-breakpoint
DROP INDEX `idx_vendor_user`;--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_profiles_user_id_unique` ON `vendor_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `investments_bond_serial_unique` ON `investments` (`bond_serial_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `roi_payments_escrow_tx_unique` ON `roi_payments` (`escrow_tx_id`);