ALTER TABLE `contributions` ADD `payment_method` text DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `contributions` ADD `payment_status` text DEFAULT 'completed';--> statement-breakpoint
ALTER TABLE `contributions` ADD `payment_tx_ref` text;--> statement-breakpoint
ALTER TABLE `contributions` ADD `payment_checkout_url` text;