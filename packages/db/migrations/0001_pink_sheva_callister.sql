CREATE TABLE `credit_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`repayment_history_score` real DEFAULT 0 NOT NULL,
	`outstanding_loans_score` real DEFAULT 0 NOT NULL,
	`savings_score` real DEFAULT 0 NOT NULL,
	`guarantor_score` real DEFAULT 0 NOT NULL,
	`membership_duration_score` real DEFAULT 0 NOT NULL,
	`last_calculated` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `loan_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`installment_number` integer NOT NULL,
	`due_date` integer NOT NULL,
	`principal_due` real NOT NULL,
	`interest_due` real NOT NULL,
	`total_due` real NOT NULL,
	`principal_paid` real DEFAULT 0 NOT NULL,
	`interest_paid` real DEFAULT 0 NOT NULL,
	`penalty_paid` real DEFAULT 0 NOT NULL,
	`total_paid` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `penalties` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`amount` real NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`applied_by` text,
	`applied_at` integer,
	`paid_at` integer,
	`waived_by` text,
	`waived_at` integer,
	`waiver_reason` text,
	`notes` text,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`applied_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`waived_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
