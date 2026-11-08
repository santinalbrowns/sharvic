import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { members } from './members';
import { users } from './users';

export const savingsAccounts = sqliteTable('savings_accounts', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  memberId: text('member_id').notNull().references(() => members.id),
  accountNo: text('account_no').notNull().unique(),
  balance: real('balance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const contributions = sqliteTable('contributions', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  memberId: text('member_id').notNull().references(() => members.id),
  savingsAccountId: text('savings_account_id').notNull().references(() => savingsAccounts.id),
  amount: real('amount').notNull(),
  contributionMonth: text('contribution_month').notNull(), // YYYY-MM
  receiptNo: text('receipt_no').notNull().unique(),
  notes: text('notes'),
  receivedBy: text('received_by').references(() => users.id),
  receivedAt: integer('received_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  paymentMethod: text('payment_method', { enum: ['cash', 'mobile_money', 'card'] }).default('cash'),
  paymentStatus: text('payment_status', { enum: ['pending', 'completed', 'failed'] }).default('completed'),
  paymentTxRef: text('payment_tx_ref'),
  paymentCheckoutUrl: text('payment_checkout_url'),
});

export type SavingsAccount = typeof savingsAccounts.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
