CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`charge_id` text,
	`member_id` text NOT NULL,
	`purpose` text NOT NULL,
	`loan_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'MWK' NOT NULL,
	`phone` text NOT NULL,
	`operator` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`failure_reason` text,
	`created_by` text,
	`created_at` integer,
	`updated_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_reference_unique` ON `payments` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_charge_id_unique` ON `payments` (`charge_id`);