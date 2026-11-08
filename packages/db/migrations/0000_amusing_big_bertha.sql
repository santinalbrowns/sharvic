CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text,
	`phone` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_no` text NOT NULL,
	`user_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`gender` text,
	`date_of_birth` integer,
	`phone` text NOT NULL,
	`national_id` text,
	`address` text,
	`next_of_kin_name` text,
	`next_of_kin_phone` text,
	`member_type` text DEFAULT 'member' NOT NULL,
	`membership_fee_paid` integer DEFAULT false,
	`membership_fee_amount` real DEFAULT 50000,
	`membership_fee_paid_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_no_unique` ON `members` (`member_no`);--> statement-breakpoint
CREATE TABLE `contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`savings_account_id` text NOT NULL,
	`amount` real NOT NULL,
	`contribution_month` text NOT NULL,
	`receipt_no` text NOT NULL,
	`notes` text,
	`received_by` text,
	`received_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`savings_account_id`) REFERENCES `savings_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contributions_receipt_no_unique` ON `contributions` (`receipt_no`);--> statement-breakpoint
CREATE TABLE `savings_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`account_no` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `savings_accounts_account_no_unique` ON `savings_accounts` (`account_no`);--> statement-breakpoint
CREATE TABLE `loan_guarantors` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`guarantor_member_id` text,
	`guarantor_name` text NOT NULL,
	`guarantor_phone` text NOT NULL,
	`guarantor_national_id` text,
	`relationship` text,
	`created_at` integer,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guarantor_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loan_repayments` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`amount` real NOT NULL,
	`principal_portion` real,
	`interest_portion` real,
	`penalty_amount` real DEFAULT 0,
	`receipt_no` text NOT NULL,
	`payment_method` text DEFAULT 'cash',
	`notes` text,
	`received_by` text,
	`received_at` integer,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loan_repayments_receipt_no_unique` ON `loan_repayments` (`receipt_no`);--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_no` text NOT NULL,
	`member_id` text NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_rate` real NOT NULL,
	`interest_amount` real NOT NULL,
	`total_repayable` real NOT NULL,
	`term_months` integer NOT NULL,
	`purpose` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`applied_at` integer,
	`reviewed_by` text,
	`reviewed_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`disbursed_by` text,
	`disbursed_at` integer,
	`rejection_reason` text,
	`outstanding_balance` real DEFAULT 0 NOT NULL,
	`notes` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`disbursed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loans_loan_no_unique` ON `loans` (`loan_no`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_no` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`paid_to` text,
	`payment_method` text DEFAULT 'cash',
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by` text,
	`approved_by` text,
	`approved_at` integer,
	`paid_at` integer,
	`receipt_url` text,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_expense_no_unique` ON `expenses` (`expense_no`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`ip_address` text,
	`user_agent` text,
	`details` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_no` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`direction` text NOT NULL,
	`description` text NOT NULL,
	`reference_id` text,
	`reference_type` text,
	`balance_after` real,
	`performed_by` text,
	`performed_at` integer,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_transaction_no_unique` ON `transactions` (`transaction_no`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);