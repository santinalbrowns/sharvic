import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { members } from './members';
import { loans } from './loans';
import { users } from './users';

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  reference: text('reference').notNull().unique(),
  chargeId: text('charge_id').unique(),
  memberId: text('member_id').notNull().references(() => members.id),
  purpose: text('purpose', { enum: ['savings', 'loan_repayment'] }).notNull(),
  loanId: text('loan_id').references(() => loans.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('MWK'),
  phone: text('phone').notNull(),
  operator: text('operator').notNull(),
  status: text('status', { enum: ['pending', 'successful', 'failed'] }).notNull().default('pending'),
  failureReason: text('failure_reason'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
